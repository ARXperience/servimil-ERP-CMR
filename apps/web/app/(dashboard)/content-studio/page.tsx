import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, Calendar as CalendarIcon, Instagram, Palette, Users, Target } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Content Studio AI | SERVIMIL OS',
  description: 'Estudio de contenido impulsado por IA',
};

export default function ContentStudioPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Studio AI</h1>
          <p className="text-muted-foreground mt-2">
            Genera estrategias, parrillas, imágenes realistas y programa contenido.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/content-studio/strategy">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Nueva Campaña
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats/Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parrilla Editorial</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Publicaciones programadas</p>
            <Link href="/content-studio/calendar" className="mt-4 block text-sm text-blue-600 hover:underline">
              Ver calendario &rarr;
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imágenes Generadas</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
            <Link href="/content-studio/generator" className="mt-4 block text-sm text-blue-600 hover:underline">
              Generar más &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Kit & Assets</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Kits de marca activos</p>
            <Link href="/content-studio/brand-kit" className="mt-4 block text-sm text-blue-600 hover:underline">
              Administrar activos &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integración Instagram</CardTitle>
            <Instagram className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Desconectado</div>
            <p className="text-xs text-muted-foreground">Pendiente vinculación Meta API</p>
            <Link href="/content-studio/instagram" className="mt-4 block text-sm text-blue-600 hover:underline">
              Vincular cuenta &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recientes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Campañas Activas</CardTitle>
            <CardDescription>
              Tus estrategias de contenido en curso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Lista mock por ahora */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Campaña Día de la Madre</p>
                  <p className="text-sm text-muted-foreground">
                    15 posts generados • 3 pendientes de revisión
                  </p>
                </div>
                <Button variant="outline" size="sm">Ver</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Aprobaciones Pendientes</CardTitle>
            <CardDescription>
              Piezas esperando confirmación humana.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No hay piezas pendientes de aprobación.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
