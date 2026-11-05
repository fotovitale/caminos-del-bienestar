from django.core.management.base import BaseCommand
from seed_data import run_seed


class Command(BaseCommand):
    help = 'Carga datos iniciales de Caminos del Bienestar (General San Martín, Mendoza)'

    def handle(self, *args, **options):
        run_seed()
        self.stdout.write(self.style.SUCCESS('Datos iniciales cargados correctamente.'))

