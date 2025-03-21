
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ProtectSettingsProps {
  userPassword: string;
  setUserPassword: (value: string) => void;
  ownerPassword: string;
  setOwnerPassword: (value: string) => void;
  useOwnerPassword: boolean;
  setUseOwnerPassword: (value: boolean) => void;
  canPrint: boolean;
  setCanPrint: (value: boolean) => void;
  canCopy: boolean;
  setCanCopy: (value: boolean) => void;
  canModify: boolean;
  setCanModify: (value: boolean) => void;
}

const ProtectSettings = ({
  userPassword,
  setUserPassword,
  ownerPassword,
  setOwnerPassword,
  useOwnerPassword,
  setUseOwnerPassword,
  canPrint,
  setCanPrint,
  canCopy,
  setCanCopy,
  canModify,
  setCanModify
}: ProtectSettingsProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="userPassword">2. Configura la protección</Label>
      
      <div className="p-4 border rounded-md space-y-4 opacity-70">
        <div className="space-y-2">
          <Label htmlFor="userPassword">Contraseña de usuario</Label>
          <Input
            id="userPassword"
            type="password"
            placeholder="Contraseña para abrir el documento"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Esta contraseña será necesaria para abrir el documento
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="useOwnerPassword" 
              checked={useOwnerPassword}
              onCheckedChange={(checked) => {
                setUseOwnerPassword(checked === true);
              }}
              disabled
            />
            <Label htmlFor="useOwnerPassword">Usar contraseña de propietario diferente</Label>
          </div>
          
          {useOwnerPassword && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="ownerPassword">Contraseña de propietario</Label>
              <Input
                id="ownerPassword"
                type="password"
                placeholder="Contraseña para modificar permisos"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Esta contraseña permitirá modificar la configuración de seguridad
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4 mt-4">
          <Label className="mb-2 block">Permisos (con la contraseña de usuario)</Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="canPrint" 
                checked={canPrint}
                onCheckedChange={(checked) => {
                  setCanPrint(checked === true);
                }}
                disabled
              />
              <Label htmlFor="canPrint">Permitir imprimir</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="canCopy" 
                checked={canCopy}
                onCheckedChange={(checked) => {
                  setCanCopy(checked === true);
                }}
                disabled
              />
              <Label htmlFor="canCopy">Permitir copiar texto</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="canModify" 
                checked={canModify}
                onCheckedChange={(checked) => {
                  setCanModify(checked === true);
                }}
                disabled
              />
              <Label htmlFor="canModify">Permitir modificar</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectSettings;
