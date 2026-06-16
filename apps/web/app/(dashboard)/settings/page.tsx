"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Bell, Shield, Building, Bot, Loader2 } from "lucide-react";
import { useBotConfig, useUpdateBotConfig } from "@/hooks/api/use-whatsapp-sessions";
import { Mail } from "lucide-react";

export default function SettingsPage() {
  const { data: botConfig, isLoading: isBotLoading } = useBotConfig();
  const { mutate: updateConfig, isPending: isSaving } = useUpdateBotConfig();

  const [botEnabled, setBotEnabled] = useState(false);
  const [botPrompt, setBotPrompt] = useState("");
  const [gmailClientId, setGmailClientId] = useState("");
  const [gmailClientSecret, setGmailClientSecret] = useState("");

  useEffect(() => {
    if (botConfig) {
      setBotEnabled(botConfig.enabled);
      setBotPrompt(botConfig.prompt);
    }
  }, [botConfig]);

  const handleSaveBotConfig = () => {
    updateConfig(
      { key: "whatsapp_bot_enabled", value: { enabled: botEnabled } },
      {
        onSuccess: () => {
          updateConfig({ key: "whatsapp_bot_prompt", value: { prompt: botPrompt } });
        },
      }
    );
  };

  const handleSaveEmailConfig = () => {
    updateConfig(
      { key: "GMAIL_CLIENT_ID", value: gmailClientId },
      {
        onSuccess: () => {
          updateConfig({ key: "GMAIL_CLIENT_SECRET", value: gmailClientSecret });
        },
      }
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center">
            <Building className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="ai-bot" className="flex items-center">
            <Bot className="w-4 h-4 mr-2" /> Bot de IA
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" /> Notificaciones
          </TabsTrigger>
          <TabsTrigger value="email-integration" className="flex items-center">
            <Mail className="w-4 h-4 mr-2" /> Email (Google)
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" /> Seguridad
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de la Empresa</CardTitle>
              <CardDescription>
                Actualiza los detalles de tu empresa, logo y preferencias generales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input id="companyName" defaultValue="SERVIMIL S.A.S" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">NIT</Label>
                  <Input id="taxId" defaultValue="900.123.456-7" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" defaultValue="Calle Principal 123, Bogotá" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo de Contacto</Label>
                  <Input id="email" type="email" defaultValue="contacto@servimil.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" defaultValue="+57 300 123 4567" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button>
                  <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-bot">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-primary" />
                Configuración del Bot de IA de WhatsApp
              </CardTitle>
              <CardDescription>
                Configura el auto-respondedor potenciado por IA para mensajes de WhatsApp. Utiliza Google Gemini para generar respuestas inteligentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isBotLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">Habilitar Auto-respuesta con IA</p>
                      <p className="text-sm text-muted-foreground">
                        Cuando está habilitado, el bot responderá automáticamente a los mensajes entrantes de WhatsApp usando IA.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={botEnabled}
                      onClick={() => setBotEnabled(!botEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        botEnabled ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          botEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Llave API de Gemini</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      defaultValue="***************************"
                      placeholder="AIza..."
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      La llave API está configurada en el backend. Contacta a tu administrador para cambiarla.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botPrompt">Prompt del Sistema (Personalidad del Bot)</Label>
                    <Textarea
                      id="botPrompt"
                      rows={8}
                      value={botPrompt}
                      onChange={(e) => setBotPrompt(e.target.value)}
                      placeholder="Eres un asistente de servicio al cliente útil para SERVIMIL..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define la personalidad del bot, sus instrucciones y su alcance de conocimiento. El bot usará esto como su comportamiento base.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveBotConfig} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" /> Guardar Configuración del Bot
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificación</CardTitle>
              <CardDescription>
                Configura cómo deseas recibir alertas y notificaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">El módulo de notificaciones estará disponible pronto...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-integration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary" />
                Integración de Correos con Google (OAuth 2.0)
              </CardTitle>
              <CardDescription>
                Configura las credenciales de tu aplicación de Google Cloud para habilitar la lectura de correos automatizada mediante IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gmailClientId">Google Client ID</Label>
                <Input
                  id="gmailClientId"
                  value={gmailClientId}
                  onChange={(e) => setGmailClientId(e.target.value)}
                  placeholder="ej. 123456789-xxxx.apps.googleusercontent.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gmailClientSecret">Google Client Secret</Label>
                <Input
                  id="gmailClientSecret"
                  type="password"
                  value={gmailClientSecret}
                  onChange={(e) => setGmailClientSecret(e.target.value)}
                  placeholder="ej. GOCSPX-xxxxxx"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveEmailConfig} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" /> Guardar Credenciales
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>
                Gestiona tu contraseña, autenticación 2FA y sesiones activas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <Button className="mt-4">Actualizar Contraseña</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
