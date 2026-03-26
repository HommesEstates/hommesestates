from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..deps import get_current_user, require_role
from ..models import (
    Document,
    DocumentWorkspace,
    DocumentFolder,
    DocumentTag,
    DocumentTagLink,
    DocumentVersion,
    DocumentComment,
    DocumentShare,
)
from ..services.dms import DmsService
from ..config import settings

router = APIRouter(prefix="/dms", tags=["dms"])

dms = DmsService(settings.dms_storage_path)


# Workspaces
@router.post("/workspaces")
def create_workspace(name: str, description: Optional[str] = None, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    ws = DocumentWorkspace(name=name, description=description)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return {"id": ws.id, "name": ws.name, "description": ws.description}


@router.get("/workspaces")
def list_workspaces(limit: int = 50, offset: int = 0, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    q = db.query(DocumentWorkspace).order_by(DocumentWorkspace.id.desc())
    items = q.offset(offset).limit(limit).all()
    return [{"id": x.id, "name": x.name, "description": x.description} for x in items]


# Folders
@router.post("/folders")
def create_folder(name: str, parent_id: Optional[int] = None, workspace_id: Optional[int] = None, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    if parent_id:
        parent = db.query(DocumentFolder).filter(DocumentFolder.id == parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Invalid parent_id")
    if workspace_id:
        ws = db.query(DocumentWorkspace).filter(DocumentWorkspace.id == workspace_id).first()
        if not ws:
            raise HTTPException(status_code=400, detail="Invalid workspace_id")
    f = DocumentFolder(name=name, parent_id=parent_id, workspace_id=workspace_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return {"id": f.id, "name": f.name, "parent_id": f.parent_id, "workspace_id": f.workspace_id}


@router.get("/folders")
def list_folders(workspace_id: Optional[int] = None, limit: int = 100, offset: int = 0, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    q = db.query(DocumentFolder)
    if workspace_id:
        q = q.filter(DocumentFolder.workspace_id == workspace_id)
    items = q.order_by(DocumentFolder.id.desc()).offset(offset).limit(limit).all()
    return [{"id": x.id, "name": x.name, "parent_id": x.parent_id, "workspace_id": x.workspace_id} for x in items]


# Tags
@router.post("/tags")
def create_tag(name: str, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    existing = db.query(DocumentTag).filter(DocumentTag.name == name).first()
    if existing:
        return {"id": existing.id, "name": existing.name}
    t = DocumentTag(name=name)
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "name": t.name}


@router.get("/tags")
def list_tags(limit: int = 100, offset: int = 0, user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(DocumentTag).order_by(DocumentTag.name.asc())
    items = q.offset(offset).limit(limit).all()
    return [{"id": x.id, "name": x.name} for x in items]


@router.get("/documents/{doc_id}/tags")
def list_doc_tags(doc_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # ACL: portal users may only access their own document
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != "staff":
        if not user.partner_id or (doc.partner_id and doc.partner_id != user.partner_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    links = db.query(DocumentTagLink).filter(DocumentTagLink.document_id == doc_id).all()
    tags = db.query(DocumentTag).filter(DocumentTag.id.in_([l.tag_id for l in links] or [0])).all()
    return [{"id": t.id, "name": t.name} for t in tags]


@router.post("/documents/{doc_id}/tags")
def add_doc_tag(doc_id: int, tag_id: int, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    tag = db.query(DocumentTag).filter(DocumentTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    link = db.query(DocumentTagLink).filter(DocumentTagLink.document_id == doc_id, DocumentTagLink.tag_id == tag_id).first()
    if link:
        return {"ok": True}


@router.get("/documents")
def list_documents(
    folder_id: Optional[int] = None,
    partner_id: Optional[int] = None,
    offer_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(require_role("staff")),
    db: Session = Depends(get_db),
):
    q = db.query(Document)
    if folder_id is not None:
        q = q.filter(Document.folder_id == folder_id)
    if partner_id is not None:
        q = q.filter(Document.partner_id == partner_id)
    if offer_id is not None:
        q = q.filter(Document.offer_id == offer_id)
    items = q.order_by(Document.id.desc()).offset(offset).limit(limit).all()
    out = []
    for d in items:
        out.append({
            "id": d.id,
            "name": d.name,
            "content_type": d.content_type,
            "size": d.size,
            "folder_id": d.folder_id,
            "partner_id": d.partner_id,
            "offer_id": d.offer_id,
            "download_url": f"/documents/{d.id}/download",
        })
    return {"documents": out}


@router.delete("/documents/{doc_id}/tags/{tag_id}")
def remove_doc_tag(doc_id: int, tag_id: int, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    link = db.query(DocumentTagLink).filter(DocumentTagLink.document_id == doc_id, DocumentTagLink.tag_id == tag_id).first()
    if link:
        db.delete(link)
        db.commit()
    return {"ok": True}


# Comments
@router.get("/documents/{doc_id}/comments")
def list_comments(doc_id: int, limit: int = 100, offset: int = 0, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # ACL
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != "staff":
        if not user.partner_id or (doc.partner_id and doc.partner_id != user.partner_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    items = (
        db.query(DocumentComment)
        .filter(DocumentComment.document_id == doc_id)
        .order_by(DocumentComment.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        {"id": c.id, "body": c.body, "user_id": c.user_id, "partner_id": c.partner_id}
        for c in items
    ]


@router.post("/documents/{doc_id}/comments")
def add_comment(doc_id: int, body: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != "staff":
        if not user.partner_id or (doc.partner_id and doc.partner_id != user.partner_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    c = DocumentComment(
        document_id=doc_id,
        user_id=(user.id if user.role == "staff" else None),
        partner_id=(user.partner_id if user.role != "staff" else None),
        body=body,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "body": c.body}


# Versions
@router.get("/documents/{doc_id}/versions")
def list_versions(doc_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # ACL
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != "staff":
        if not user.partner_id or (doc.partner_id and doc.partner_id != user.partner_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    items = db.query(DocumentVersion).filter(DocumentVersion.document_id == doc_id).order_by(DocumentVersion.version_no.asc()).all()
    return [
        {"id": v.id, "version_no": v.version_no, "size": v.size, "file_path": v.file_path}
        for v in items
    ]


@router.post("/documents/{doc_id}/versions")
async def add_version(doc_id: int, file: UploadFile = File(...), user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    content = await file.read()
    rel_path, size = dms.save_bytes(content, file.filename)
    # Compute next version number
    last = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == doc_id)
        .order_by(DocumentVersion.version_no.desc())
        .first()
    )
    next_no = 1 if not last else (last.version_no + 1)
    ver = DocumentVersion(document_id=doc_id, version_no=next_no, file_path=rel_path, size=size)
    db.add(ver)
    db.commit()
    db.refresh(ver)
    return {"id": ver.id, "version_no": ver.version_no, "size": ver.size}


@router.post("/documents/{doc_id}/versions/{version_id}/restore")
def restore_version(doc_id: int, version_id: int, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    ver = db.query(DocumentVersion).filter(DocumentVersion.id == version_id, DocumentVersion.document_id == doc_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Version not found")
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.file_path = ver.file_path
    doc.size = ver.size
    db.add(doc)
    db.commit()
    return {"ok": True}


# Shares: list and revoke
@router.get("/documents/{doc_id}/shares")
def list_shares(doc_id: int, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    items = db.query(DocumentShare).filter(DocumentShare.document_id == doc_id).order_by(DocumentShare.id.desc()).all()
    return [
        {"id": s.id, "token": s.access_token, "expires_at": s.expires_at.isoformat() if s.expires_at else None}
        for s in items
    ]


@router.delete("/shares/{share_id}")
def revoke_share(share_id: int, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    s = db.query(DocumentShare).filter(DocumentShare.id == share_id).first()
    if s:
        db.delete(s)
        db.commit()
    return {"ok": True}


# Upload and move
@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = None,
    folder_id: Optional[int] = None,
    partner_id: Optional[int] = None,
    offer_id: Optional[int] = None,
    doc_type: Optional[str] = "other",
    user=Depends(require_role("staff")),
    db: Session = Depends(get_db),
):
    if folder_id:
        folder = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=400, detail="Invalid folder_id")
    content = await file.read()
    rel_path, size = dms.save_bytes(content, file.filename)
    doc = Document(
        name=name or file.filename,
        content_type=file.content_type or "application/octet-stream",
        doc_type=doc_type or "other",
        size=size,
        file_path=rel_path,
        folder_id=folder_id,
        partner_id=partner_id,
        offer_id=offer_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id,
        "name": doc.name,
        "size": doc.size,
        "content_type": doc.content_type,
        "download_url": f"/documents/{doc.id}/download",
    }


@router.post("/documents/{doc_id}/move")
def move_document(doc_id: int, folder_id: Optional[int] = None, user=Depends(require_role("staff")), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if folder_id:
        folder = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=400, detail="Invalid folder_id")
    doc.folder_id = folder_id
    db.add(doc)
    db.commit()
    return {"ok": True}
