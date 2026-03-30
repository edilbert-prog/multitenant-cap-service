import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ValidationLayout from './ValidationLayout';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5200/api');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to localStorage or user preferences
    localStorage.setItem('api_base_url', apiUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ValidationLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure the backend API endpoint for the data comparator service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {saved && (
            <Alert variant="success">
              <AlertDescription>Settings saved successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3000/api"
            />
            <p className="text-sm text-muted-foreground">
              The base URL for the data comparator API
            </p>
          </div>

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Data Comparator Tool</p>
            <p className="text-muted-foreground">Version: 0.5.0</p>
            <p className="text-muted-foreground">
              A flexible data comparison tool that connects to multiple data sources, applies transformation rules, and
              generates comparison reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </ValidationLayout>
  );
}
