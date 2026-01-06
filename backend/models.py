from pydantic import BaseModel
from typing import List, Optional

class Person(BaseModel):
    name: str
    email: Optional[str] = None

class Assignment(BaseModel):
    person: Person
    month: str
    task: str = "Preparar la comida del mes"

class RouletteConfig(BaseModel):
    participants: List[Person]
