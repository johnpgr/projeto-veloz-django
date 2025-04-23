#!/usr/bin/env python3
import argparse
import subprocess
import sys
import os
from typing import Optional
import signal

def run_command(command: str, env: Optional[dict] = None) -> subprocess.Popen:
    """Run a command in a subprocess"""
    return subprocess.Popen(
        command,
        shell=True,
        env={**os.environ, **(env or {})},
        preexec_fn=os.setsid
    )

def activate_venv() -> dict:
    """Activate virtual environment and return the modified environment"""
    venv_activate = "./env/bin/activate"
    if not os.path.exists(venv_activate):
        print("Virtual environment not found at ./env")
        sys.exit(1)
    
    env = os.environ.copy()
    env['VIRTUAL_ENV'] = os.path.abspath('./env')
    env['PATH'] = os.path.abspath('./env/bin') + ':' + env['PATH']
    return env

def install_command():
    """Install all dependencies (pip and npm)"""
    print("Installing dependencies...")
    
    # Install Python dependencies
    env = activate_venv()
    process = run_command("pip install -r requirements.txt", env=env)
    process.wait()
    
    if process.returncode != 0:
        print("Failed to install Python dependencies")
        sys.exit(1)
    
    # Install npm dependencies
    process = run_command("npm install")
    process.wait()
    
    if process.returncode != 0:
        print("Failed to install npm dependencies")
        sys.exit(1)
    
    print("All dependencies installed successfully!")

def dev_command():
    """Run development servers (Django + Tailwind)"""
    processes = []
    
    try:
        # Start Django server
        env = activate_venv()
        django_process = run_command("python manage.py runserver", env=env)
        processes.append(django_process)
        
        # Start Tailwind
        tailwind_process = run_command("npm run css:watch")
        processes.append(tailwind_process)
        
        # Wait for any process to finish or user interrupt
        while all(p.poll() is None for p in processes):
            pass
            
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        # Kill all processes and their children
        for p in processes:
            if p.poll() is None:  # if process is still running
                os.killpg(os.getpgid(p.pid), signal.SIGTERM)

def prod_command():
    """Run in production mode"""
    try:
        # Build Tailwind CSS
        print("Building Tailwind CSS...")
        build_process = run_command("npm run css:build")
        build_process.wait()
        
        if build_process.returncode != 0:
            print("Failed to build Tailwind CSS")
            sys.exit(1)
        
        print("Tailwind CSS built successfully!")
        
        # Start Django server in production mode
        print("Starting Django server in production mode...")
        env = activate_venv()
        env['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'  # Adjust this path as needed
        django_process = run_command("python manage.py runserver 0.0.0.0:8000", env=env)
        
        # Wait for Django process to finish or user interrupt
        django_process.wait()
            
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        if django_process.poll() is None:
            os.killpg(os.getpgid(django_process.pid), signal.SIGTERM)

def makemigrations_command():
    """Run Django makemigrations"""
    print("Running makemigrations...")
    env = activate_venv()
    process = run_command("python manage.py makemigrations", env=env)
    process.wait()
    
    if process.returncode != 0:
        print("Failed to make migrations")
        sys.exit(1)
    
    print("Migrations created successfully!")

def migrate_command():
    """Run Django migrate"""
    print("Running migrations...")
    env = activate_venv()
    process = run_command("python manage.py migrate", env=env)
    process.wait()
    
    if process.returncode != 0:
        print("Failed to apply migrations")
        sys.exit(1)
    
    print("Migrations applied successfully!")

def seed_command():
    """Run Django seed_products command"""
    print("Seeding products...")
    env = activate_venv()
    process = run_command("python manage.py seed_products", env=env)
    process.wait()
    
    if process.returncode != 0:
        print("Failed to seed products")
        sys.exit(1)
    
    print("Products seeded successfully!")

def main():
    parser = argparse.ArgumentParser(description="Development CLI tool")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Install command
    install_parser = subparsers.add_parser("install", help="Install all dependencies (pip and npm)")
    
    # Dev command
    dev_parser = subparsers.add_parser("dev", help="Run development servers (Django + Tailwind)")
    
    # Prod command
    prod_parser = subparsers.add_parser("prod", help="Run in production mode (build Tailwind + Django)")
    
    # Makemigrations command
    makemigrations_parser = subparsers.add_parser("makemigrations", help="Run Django makemigrations")
    
    # Migrate command
    migrate_parser = subparsers.add_parser("migrate", help="Run Django migrate")

    # Seed command
    seed_parser = subparsers.add_parser("seed", help="Run Django seed_products command")
    
    args = parser.parse_args()
    
    if args.command == "install":
        install_command()
    elif args.command == "dev":
        dev_command()
    elif args.command == "prod":
        prod_command()
    elif args.command == "makemigrations":
        makemigrations_command()
    elif args.command == "migrate":
        migrate_command()
    elif args.command == "seed":
        seed_command()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
