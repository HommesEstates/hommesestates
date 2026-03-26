"""Admin Document Management API endpoints - Full implementation matching Odoo DMS functionality."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from pathlib import Path

from ..database import get_db
from ..models import (
    Document, DocumentFolder, DocumentVersion, DocumentTemplate,
    DocumentShare, DocumentAccessLog, Partner, Offer, Payment
)
from ..services.document_service import DocumentService, TemplateService, PDFService
from ..config import settings
from .auth import get_current_user, require_staff

router = APIRouter(prefix="/admin/documents", tags=["admin-documents"])


# ============ Pydantic Schemas ============

class DocumentResponse(BaseModel):
    id: int
    name: str
    content_type: str
    doc_type: str
    size: int
    folder_id: Optional[int]
    partner_id: Optional[int]
    offer_id: Optional[int]
    payment_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    workspace_id: Optional[int]
    path: Optional[str] = None

    class Config:
        from_attributes = True


class TemplateResponse(BaseModel):
    id: int
    name: str
    document_type: str
    active: int

    class Config:
        from_attributes = True


class ShareResponse(BaseModel):
    id: int
    document_id: int
    access_token: str
    expires_at: Optional[datetime]
    download_url: str

    class Config:
        from_attributes = True


# ============ Document CRUD ============

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    doc_type: Optional[str] = None,
    partner_id: Optional[int] = None,
    offer_id: Optional[int] = None,
    folder_id: Optional[int] = None,
    query: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """List documents with filters."""
    documents = DocumentService.search_documents(
        db=db,
        query=query,
        doc_type=doc_type,
        partner_id=partner_id,
        folder_id=folder_id,
        limit=limit,
    )
    
    return [
        DocumentResponse(
            id=d.id,
            name=d.name,
            content_type=d.content_type,
            doc_type=d.doc_type,
            size=d.size,
            folder_id=d.folder_id,
            partner_id=d.partner_id,
            offer_id=d.offer_id,
            payment_id=d.payment_id,
            created_at=d.created_at,
        )
        for d in documents
    ]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Get document details."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse(
        id=doc.id,
        name=doc.name,
        content_type=doc.content_type,
        doc_type=doc.doc_type,
        size=doc.size,
        folder_id=doc.folder_id,
        partner_id=doc.partner_id,
        offer_id=doc.offer_id,
        payment_id=doc.payment_id,
        created_at=doc.created_at,
    )


@router.post("", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = "other",
    folder_id: Optional[int] = None,
    partner_id: Optional[int] = None,
    offer_id: Optional[int] = None,
    payment_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Upload a new document."""
    # Read file content
    content = await file.read()
    size = len(content)
    
    # Generate file path
    folder_path = f"uploads/{doc_type}"
    if partner_id:
        folder_path = f"partners/{partner_id}"
    if offer_id:
        folder_path = f"offers/{offer_id}"
    
    file_path = f"{folder_path}/{file.filename}"
    
    # Ensure directory exists
    full_path = Path(settings.document_storage_path) / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write file
    with open(full_path, 'wb') as f:
        f.write(content)
    
    # Create document record
    doc = DocumentService.create_document(
        db=db,
        name=file.filename,
        content_type=file.content_type or "application/octet-stream",
        doc_type=doc_type,
        file_path=file_path,
        size=size,
        folder_id=folder_id,
        partner_id=partner_id,
        offer_id=offer_id,
        payment_id=payment_id,
    )
    
    return DocumentResponse(
        id=doc.id,
        name=doc.name,
        content_type=doc.content_type,
        doc_type=doc.doc_type,
        size=doc.size,
        folder_id=doc.folder_id,
        partner_id=doc.partner_id,
        offer_id=doc.offer_id,
        payment_id=doc.payment_id,
        created_at=doc.created_at,
    )


@router.delete("/{document_id}")
def delete_document(document_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Delete a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    full_path = Path(settings.document_storage_path) / doc.file_path
    if full_path.exists():
        os.remove(full_path)
    
    # Delete record
    db.delete(doc)
    db.commit()
    
    return {"ok": True, "message": "Document deleted"}


# ============ Document Versions ============

@router.get("/{document_id}/versions")
def list_document_versions(document_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """List versions of a document."""
    versions = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(DocumentVersion.version_number.desc()).all()
    
    return {
        "versions": [
            {
                "id": v.id,
                "version_number": v.version_number,
                "size": v.size,
                "uploaded_by": v.uploaded_by,
                "notes": v.notes,
                "created_at": str(v.created_at),
            }
            for v in versions
        ]
    }


@router.post("/{document_id}/versions")
async def create_document_version(
    document_id: int,
    file: UploadFile = File(...),
    notes: Optional[str] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Create a new version of a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Read file content
    content = await file.read()
    size = len(content)
    
    # Generate version path
    version_path = f"{doc.file_path}_v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Ensure directory exists
    full_path = Path(settings.document_storage_path) / version_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write file
    with open(full_path, 'wb') as f:
        f.write(content)
    
    # Create version record
    version = DocumentService.create_version(
        db=db,
        document_id=document_id,
        file_path=version_path,
        size=size,
        file_content=content,
        uploaded_by=user.id,
        notes=notes,
    )
    
    return {
        "ok": True,
        "version_id": version.id,
        "version_number": version.version_number,
    }


# ============ Folders ============

@router.get("/folders", response_model=List[FolderResponse])
def list_folders(
    parent_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """List document folders."""
    query = db.query(DocumentFolder)
    
    if parent_id is not None:
        query = query.filter(DocumentFolder.parent_id == parent_id)
    else:
        query = query.filter(DocumentFolder.parent_id == None)
    
    folders = query.all()
    
    return [
        FolderResponse(
            id=f.id,
            name=f.name,
            parent_id=f.parent_id,
            workspace_id=f.workspace_id,
            path=DocumentService.get_folder_path(db, f.id),
        )
        for f in folders
    ]


@router.post("/folders", response_model=FolderResponse)
def create_folder(
    name: str,
    parent_id: Optional[int] = None,
    workspace_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Create a document folder."""
    folder = DocumentService.create_folder(
        db=db,
        name=name,
        parent_id=parent_id,
        workspace_id=workspace_id,
    )
    
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        parent_id=folder.parent_id,
        workspace_id=folder.workspace_id,
        path=DocumentService.get_folder_path(db, folder.id),
    )


# ============ Templates ============

@router.get("/templates", response_model=List[TemplateResponse])
def list_templates(
    document_type: Optional[str] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """List document templates."""
    query = db.query(DocumentTemplate)
    
    if document_type:
        query = query.filter(DocumentTemplate.document_type == document_type)
    
    templates = query.all()
    
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            document_type=t.document_type,
            active=t.active,
        )
        for t in templates
    ]


@router.post("/templates")
def create_template(
    name: str,
    document_type: str,
    html_content: str,
    css_style: Optional[str] = None,
    requires_signature: int = 1,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Create a document template."""
    template = DocumentTemplate(
        name=name,
        document_type=document_type,
        html_content=html_content,
        css_style=css_style,
        requires_signature=requires_signature,
        active=1,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return {"ok": True, "id": template.id}


# ============ Sharing ============

@router.post("/{document_id}/share", response_model=ShareResponse)
def create_share_link(
    document_id: int,
    password: Optional[str] = None,
    expires_days: Optional[int] = 7,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Create a share link for a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    share = DocumentService.create_share(
        db=db,
        document_id=document_id,
        password=password,
        expires_days=expires_days,
    )
    
    return ShareResponse(
        id=share.id,
        document_id=share.document_id,
        access_token=share.access_token,
        expires_at=share.expires_at,
        download_url=f"/api/shared/{share.access_token}",
    )


@router.get("/{document_id}/shares")
def list_shares(document_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """List share links for a document."""
    shares = db.query(DocumentShare).filter(
        DocumentShare.document_id == document_id
    ).all()
    
    return {
        "shares": [
            {
                "id": s.id,
                "access_token": s.access_token,
                "expires_at": str(s.expires_at) if s.expires_at else None,
                "download_url": f"/api/shared/{s.access_token}",
            }
            for s in shares
        ]
    }


# ============ Access Logs ============

@router.get("/{document_id}/access-logs")
def get_access_logs(document_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Get access logs for a document."""
    logs = db.query(DocumentAccessLog).filter(
        DocumentAccessLog.document_id == document_id
    ).order_by(DocumentAccessLog.created_at.desc()).limit(100).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "status_code": log.status_code,
                "created_at": str(log.created_at),
            }
            for log in logs
        ]
    }


# ============ Document Generation ============

@router.post("/generate/offer-letter/{offer_id}")
def generate_offer_letter(
    offer_id: int,
    template_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Generate offer letter for an offer."""
    from ..models import Offer
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    doc = PDFService.generate_offer_letter(db, offer, template_id)
    
    return {
        "ok": True,
        "document_id": doc.id,
        "download_url": f"/api/documents/{doc.id}/download",
    }


@router.post("/generate/payment-ack/{payment_id}")
def generate_payment_ack(
    payment_id: int,
    template_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Generate payment acknowledgement for a payment."""
    from ..models import Payment
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    doc = PDFService.generate_payment_acknowledgement(db, payment, template_id)
    
    return {
        "ok": True,
        "document_id": doc.id,
        "download_url": f"/api/documents/{doc.id}/download",
    }
