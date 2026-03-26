"""Database migration utilities."""
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional


class MigrationManager:
    """Utility class for managing database migrations."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.alembic_cmd = [
            sys.executable, "-m", "alembic"
        ]
    
    def init_alembic(self) -> bool:
        """Initialize Alembic in the project."""
        try:
            # Create migrations directory if it doesn't exist
            migrations_dir = self.project_root / "migrations"
            migrations_dir.mkdir(exist_ok=True)
            
            # Create versions directory
            versions_dir = migrations_dir / "versions"
            versions_dir.mkdir(exist_ok=True)
            
            print("✅ Alembic initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize Alembic: {e}")
            return False
    
    def create_migration(self, message: str, autogenerate: bool = True) -> bool:
        """Create a new migration."""
        try:
            cmd = self.alembic_cmd.copy()
            
            if autogenerate:
                cmd.extend(["revision", "--autogenerate", "-m", message])
            else:
                cmd.extend(["revision", "-m", message])
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ Migration created: {message}")
                print(result.stdout)
                return True
            else:
                print(f"❌ Failed to create migration: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error creating migration: {e}")
            return False
    
    def upgrade_database(self, revision: str = "head") -> bool:
        """Upgrade database to a specific revision."""
        try:
            cmd = self.alembic_cmd + ["upgrade", revision]
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ Database upgraded to {revision}")
                print(result.stdout)
                return True
            else:
                print(f"❌ Failed to upgrade database: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error upgrading database: {e}")
            return False
    
    def downgrade_database(self, revision: str = "-1") -> bool:
        """Downgrade database to a specific revision."""
        try:
            cmd = self.alembic_cmd + ["downgrade", revision]
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ Database downgraded to {revision}")
                print(result.stdout)
                return True
            else:
                print(f"❌ Failed to downgrade database: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error downgrading database: {e}")
            return False
    
    def get_current_revision(self) -> Optional[str]:
        """Get the current database revision."""
        try:
            cmd = self.alembic_cmd + ["current"]
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                return None
        except Exception:
            return None
    
    def get_migration_history(self) -> Optional[str]:
        """Get the migration history."""
        try:
            cmd = self.alembic_cmd + ["history", "--verbose"]
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                return result.stdout
            else:
                return None
        except Exception:
            return None
    
    def check_migration_status(self) -> dict:
        """Check the migration status."""
        current = self.get_current_revision()
        history = self.get_migration_history()
        
        return {
            "current_revision": current,
            "has_migrations": history is not None and len(history.strip()) > 0,
            "needs_upgrade": current is None or "head" not in current.lower() if current else True
        }


def get_migration_manager() -> MigrationManager:
    """Get the migration manager instance."""
    project_root = Path(__file__).parent.parent
    return MigrationManager(project_root)


# CLI functions for easy migration management
def init_migrations():
    """Initialize migrations for the project."""
    manager = get_migration_manager()
    return manager.init_alembic()


def create_migration(message: str, autogenerate: bool = True):
    """Create a new migration."""
    manager = get_migration_manager()
    return manager.create_migration(message, autogenerate)


def upgrade_database(revision: str = "head"):
    """Upgrade the database."""
    manager = get_migration_manager()
    return manager.upgrade_database(revision)


def downgrade_database(revision: str = "-1"):
    """Downgrade the database."""
    manager = get_migration_manager()
    return manager.downgrade_database(revision)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration utilities")
    parser.add_argument("command", choices=["init", "create", "upgrade", "downgrade", "status"])
    parser.add_argument("--message", help="Migration message")
    parser.add_argument("--revision", help="Target revision", default="head")
    parser.add_argument("--no-autogenerate", action="store_true", help="Disable autogenerate")
    
    args = parser.parse_args()
    
    if args.command == "init":
        init_migrations()
    elif args.command == "create":
        if not args.message:
            print("❌ Message is required for creating migrations")
            sys.exit(1)
        create_migration(args.message, not args.no_autogenerate)
    elif args.command == "upgrade":
        upgrade_database(args.revision)
    elif args.command == "downgrade":
        downgrade_database(args.revision)
    elif args.command == "status":
        manager = get_migration_manager()
        status = manager.check_migration_status()
        print("Migration Status:")
        for key, value in status.items():
            print(f"  {key}: {value}")
