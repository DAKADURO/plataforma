import { QRCodeSVG } from 'qrcode.react';

export default function QRLabel({ sku, name, department }: { sku: string, name: string, department: string }) {
  return (
    <div className="w-[60mm] h-[40mm] border border-black p-2 flex flex-col items-center justify-center bg-white text-black break-inside-avoid">
      <div className="flex items-center gap-2 w-full h-full">
        <div className="flex-shrink-0">
          <QRCodeSVG value={sku} size={64} level="H" />
        </div>
        <div className="flex flex-col justify-center w-full min-w-0 overflow-hidden">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">{department}</p>
          <p className="text-[11px] font-bold leading-tight line-clamp-2 uppercase break-words">{name}</p>
          <p className="text-[10px] font-mono mt-1 border-t border-black pt-0.5 inline-block">{sku}</p>
        </div>
      </div>
    </div>
  );
}
