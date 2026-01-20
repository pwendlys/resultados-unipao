import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Save, Loader2 } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

const ProfileCard = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleSave = () => {
    updateProfile.mutate({ fullName }, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const handleChange = (value: string) => {
    setFullName(value);
    setIsDirty(value !== (profile?.full_name || ''));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Meu Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Nome completo</label>
          <Input
            value={fullName}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Digite seu nome completo"
          />
          <p className="text-xs text-muted-foreground">
            Este nome aparecerá nas assinaturas e relatórios.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || updateProfile.isPending}
          size="sm"
          className="w-full"
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
