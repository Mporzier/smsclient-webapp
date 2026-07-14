declare module "qrcode" {
  type QRCodeToDataURLOptions = {
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  };

  type QRCodeModule = {
    toDataURL(
      text: string,
      options?: QRCodeToDataURLOptions,
    ): Promise<string>;
  };

  const qrcode: QRCodeModule;
  export default qrcode;
}
