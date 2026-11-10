export const STORE_CONFIG = {
  brandName: 'Lazarus',
  hero: {
    eyebrow: 'Diseño · Fotografía · Producto',
    title: 'Muere diseñando. Vive creando.',
    description: 'Lazarus es una marca de cultura urbana. Diseño gráfico, fotografía y mercancía con identidad. Cada pieza nace de la calle y vuelve a ella.',
  },
  landingImages: {
    hero: 'https://images.pexels.com/photos/9651392/pexels-photo-9651392.jpeg?auto=compress&cs=tinysrgb&h=1080&w=1920',
    gallery: [
      { url: 'https://images.pexels.com/photos/1707640/pexels-photo-1707640.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Mural urbano con retrato', span: 'col-span-2 row-span-2' },
      { url: 'https://images.pexels.com/photos/1366851/pexels-photo-1366851.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Graffiti con máscaras 3D', span: 'col-span-1 row-span-1' },
      { url: 'https://images.pexels.com/photos/16313664/pexels-photo-16313664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Artista digital trabajando', span: 'col-span-1 row-span-1' },
      { url: 'https://images.pexels.com/photos/14525931/pexels-photo-14525931.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Cámara de cine vintage', span: 'col-span-2 row-span-1' },
      { url: 'https://images.pexels.com/photos/7951901/pexels-photo-7951901.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Pintando graffiti con spray', span: 'col-span-1 row-span-2' },
      { url: 'https://images.pexels.com/photos/414974/pexels-photo-414974.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Workspace creativo', span: 'col-span-1 row-span-1' },
      { url: 'https://images.pexels.com/photos/6416859/pexels-photo-6416859.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Primer plano de lente', span: 'col-span-1 row-span-1' },
      { url: 'https://images.pexels.com/photos/14754790/pexels-photo-14754790.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Arte urbano en muro de ladrillo', span: 'col-span-2 row-span-1' },
    ],
  },
  socialLinks: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    tiktok: 'https://tiktok.com',
  },
  checkoutMessages: {
    successReceipt: '¡Pedido completado! Una vez verificado el pago, nos contactaremos contigo por WhatsApp para coordinar la entrega o retiro.',
    successWhatsApp: '¡Pedido registrado! Hemos guardado tu pedido y abrimos WhatsApp para coordinar el pago y la entrega.',
  },
  banking: {
    bankName: 'PRODUBANCO',
    accountHolder: 'JIMMY GUTIEREZ',
    accountNumber: '#20006714925',
    accountType: 'CUENTA DE AHORROS',
    identification: '0909867202',
  },
  paypalUrl: '',
  whatsappNumber: 'wa.me/593978666172',
  customStickerPrice: 0,
} as const;
