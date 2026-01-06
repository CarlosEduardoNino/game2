import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .models import Person
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_assignment_email(person: Person, month: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print("SMTP credentials not set. Skipping email.")
        return False

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = person.email
    msg['Subject'] = f"🍴 ¡Te toca cocinar! - Asignación de {month}"

    body = f"""
    Hola {person.name},

    ¡La ruleta ha hablado! 🎡
    
    Te ha correspondido la tarea de preparar la comida para el mes de {month}.
    
    ¡Que disfrutes cocinando! 👨‍🍳👩‍🍳
    """
    
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, person.email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
