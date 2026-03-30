import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Server } from 'lucide-react';

export interface SAPConnectionFormData {
  connection_name: string;
  description: string;
  ashost: string; // SAP Application Server hostname
  sysnr: string; // System number (e.g., '00')
  client: string; // SAP Client (e.g., '800')
  vault_path: string; // Vault path for credentials (e.g., 'secret/data/sap/prod')
  lang?: string; // Language code (default 'EN')
}

interface SAPConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SAPConnectionFormData) => Promise<void>;
  isLoading?: boolean;
}

export const SAPConnectionDialog: React.FC<SAPConnectionDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SAPConnectionFormData>({
    connection_name: '',
    description: '',
    ashost: '',
    sysnr: '',
    client: '',
    vault_path: '',
    lang: 'EN',
  });

  const [error, setError] = useState<string>('');

  const handleChange = (field: keyof SAPConnectionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(''); // Clear error on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.connection_name.trim()) {
      setError('Connection name is required');
      return;
    }
    if (!formData.ashost.trim()) {
      setError('Application Server hostname is required');
      return;
    }
    if (!formData.sysnr.trim()) {
      setError('System number is required');
      return;
    }
    if (!formData.client.trim()) {
      setError('SAP Client is required');
      return;
    }
    if (!formData.vault_path.trim()) {
      setError('Vault path for credentials is required');
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        connection_name: '',
        description: '',
        ashost: '',
        sysnr: '',
        client: '',
        vault_path: '',
        lang: 'EN',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create connection');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Create SAP BAPI Connection
          </DialogTitle>
          <DialogDescription>
            Configure a connection to your SAP system using RFC. Credentials will be retrieved
            securely from HashiCorp Vault.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="connection_name">
              Connection Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="connection_name"
              value={formData.connection_name}
              onChange={(e) => handleChange('connection_name', e.target.value)}
              placeholder="e.g., SAP Production"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this SAP connection..."
              rows={2}
              disabled={isLoading}
            />
          </div>

          {/* SAP Connection Details */}
          <div className="space-y-4 p-4 border border-border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm">SAP System Configuration</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ashost">
                  Application Server <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ashost"
                  value={formData.ashost}
                  onChange={(e) => handleChange('ashost', e.target.value)}
                  placeholder="e.g., sap.example.com"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">SAP Application Server hostname or IP</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sysnr">
                  System Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sysnr"
                  value={formData.sysnr}
                  onChange={(e) => handleChange('sysnr', e.target.value)}
                  placeholder="e.g., 00"
                  maxLength={2}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">2-digit system number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">
                  SAP Client <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => handleChange('client', e.target.value)}
                  placeholder="e.g., 800"
                  maxLength={3}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">3-digit client number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lang">Language</Label>
                <Input
                  id="lang"
                  value={formData.lang}
                  onChange={(e) => handleChange('lang', e.target.value)}
                  placeholder="EN"
                  maxLength={2}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">2-letter language code</p>
              </div>
            </div>
          </div>

          {/* Vault Path */}
          <div className="space-y-2 p-4 border border-border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm">Credential Storage</h4>
            <Label htmlFor="vault_path">
              Vault Path <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vault_path"
              value={formData.vault_path}
              onChange={(e) => handleChange('vault_path', e.target.value)}
              placeholder="e.g., secret/data/sap/production"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              HashiCorp Vault path where SAP credentials (user, passwd) are stored
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Connection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
