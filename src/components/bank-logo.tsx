import { HdfcLogo } from './logos/HdfcLogo';
import { SbiLogo } from './logos/SbiLogo';
import { PnbLogo } from './logos/PnbLogo';
import { IciciLogo } from './logos/IciciLogo';
import { OthersLogo } from './logos/OthersLogo';

const bankLogoComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'HDFC': HdfcLogo,
  'SBI': SbiLogo,
  'PNB': PnbLogo,
  'ICICI': IciciLogo,
  'Others': OthersLogo,
};

export const BankLogo = ({ bankName, className }: { bankName: string, className?: string }) => {
  const LogoComponent = bankLogoComponents[bankName] || OthersLogo;
  return (
    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border p-1 ${className}`}>
       <LogoComponent className="h-full w-full object-contain" />
    </div>
  );
};
