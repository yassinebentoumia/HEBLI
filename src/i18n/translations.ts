// ============================================================
// HEBLI – Multi-language translations
// Languages: English, Italian, Spanish, Arabic
// ============================================================

export type Lang = 'en' | 'fr' | 'it' | 'es' | 'ar';

export const LANG_LABELS: Record<Lang, { name: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  it: { name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇹🇳', dir: 'rtl' },
};

// All translatable strings — keep keys descriptive.
export const T = {
  // Common
  'common.back': { en: 'Back', fr: 'Retour', it: 'Indietro', es: 'Atrás', ar: 'رجوع' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler', it: 'Annulla', es: 'Cancelar', ar: 'إلغاء' },
  'common.save': { en: 'Save', fr: 'Enregistrer', it: 'Salva', es: 'Guardar', ar: 'حفظ' },
  'common.delete': { en: 'Delete', fr: 'Supprimer', it: 'Elimina', es: 'Eliminar', ar: 'حذف' },
  'common.edit': { en: 'Edit', fr: 'Modifier', it: 'Modifica', es: 'Editar', ar: 'تعديل' },
  'common.search': { en: 'Search...', fr: 'Rechercher...', it: 'Cerca...', es: 'Buscar...', ar: 'بحث...' },
  'common.loading': { en: 'Loading...', fr: 'Chargement...', it: 'Caricamento...', es: 'Cargando...', ar: 'جاري التحميل...' },
  'common.total': { en: 'Total', fr: 'Total', it: 'Totale', es: 'Total', ar: 'المجموع' },
  'common.items': { en: 'Items', fr: 'Articles', it: 'Articoli', es: 'Artículos', ar: 'العناصر' },
  'common.confirm': { en: 'Confirm', fr: 'Confirmer', it: 'Conferma', es: 'Confirmar', ar: 'تأكيد' },
  'common.close': { en: 'Close', fr: 'Fermer', it: 'Chiudi', es: 'Cerrar', ar: 'إغلاق' },
  'common.send': { en: 'Send', fr: 'Envoyer', it: 'Invia', es: 'Enviar', ar: 'إرسال' },
  'common.online': { en: 'Online', fr: 'En ligne', it: 'Online', es: 'En línea', ar: 'متصل' },
  'common.offline': { en: 'Offline', fr: 'Hors ligne', it: 'Offline', es: 'Sin conexión', ar: 'غير متصل' },

  // Navigation (Landing)
  'nav.menu': { en: 'Menu', fr: 'Menu', it: 'Menu', es: 'Menú', ar: 'القائمة' },
  'nav.track': { en: 'Track Order', fr: 'Suivre la commande', it: 'Traccia ordine', es: 'Seguir pedido', ar: 'تتبع الطلب' },
  'nav.support': { en: 'Support', fr: 'Assistance', it: 'Supporto', es: 'Soporte', ar: 'الدعم' },
  'nav.staff': { en: 'Staff Portal', fr: 'Espace Personnel', it: 'Area Staff', es: 'Portal Personal', ar: 'بوابة الموظفين' },

  // Landing
  'landing.tagline': { en: 'Coffee × Working Space', fr: 'Coffee × Working Space', it: 'Coffee × Working Space', es: 'Coffee × Working Space', ar: 'Coffee × Working Space' },
  'landing.hero.title': { en: 'Where every cup tells a story', fr: 'Où chaque tasse raconte une histoire', it: 'Dove ogni tazza racconta una storia', es: 'Donde cada taza cuenta una historia', ar: 'حيث كل فنجان يروي قصة' },
  'landing.hero.subtitle': {
    en: 'Experience the art of premium coffee, crafted with passion and precision.',
    it: 'Vivi l’arte del caffè premium, preparato con passione e precisione.',
    es: 'Vive el arte del café premium, elaborado con pasión y precisión.',
    ar: 'استمتع بفن القهوة الفاخرة، المُحضّرة بشغف ودقة.',
  },
  'landing.browse': { en: 'Browse Menu', fr: 'Voir le menu', it: 'Sfoglia il menu', es: 'Ver el menú', ar: 'تصفح القائمة' },
  'landing.collection': { en: 'Our Collection', fr: 'Notre Collection', it: 'La Nostra Collezione', es: 'Nuestra Colección', ar: 'مجموعتنا' },
  'landing.signature': { en: 'Signature', fr: 'Signature', it: 'Firma', es: 'Distintivo', ar: 'مميزة' },
  'landing.creations': { en: 'Creations', fr: 'Créations', it: 'Creazioni', es: 'Creaciones', ar: 'إبداعاتنا' },
  'landing.start': { en: 'Start Your Order', fr: 'Commencer ma commande', it: 'Inizia il tuo ordine', es: 'Comienza tu pedido', ar: 'ابدأ طلبك' },
  'landing.stats.drinks': { en: 'Premium Drinks', fr: 'Boissons Premium', it: 'Bevande Premium', es: 'Bebidas Premium', ar: 'مشروبات فاخرة' },
  'landing.stats.rating': { en: 'Rating', fr: 'Note', it: 'Valutazione', es: 'Calificación', ar: 'التقييم' },
  'landing.stats.service': { en: 'Service', fr: 'Service', it: 'Servizio', es: 'Servicio', ar: 'الخدمة' },
  'landing.help': { en: 'Need help?', fr: 'Besoin d\'aide ?', it: 'Serve aiuto?', es: '¿Necesitas ayuda?', ar: 'تحتاج مساعدة؟' },
  'landing.footer.createdWith': { en: 'Created with', fr: 'Créé avec', it: 'Creato con', es: 'Creado con', ar: 'تم تطويره بـ' },
  'landing.footer.by': { en: 'by', fr: 'par', it: 'da', es: 'por', ar: 'من قبل' },

  // Menu / Cart
  'menu.title': { en: 'Menu', fr: 'Menu', it: 'Menu', es: 'Menú', ar: 'القائمة' },
  'menu.searchPlaceholder': { en: 'Search drinks...', fr: 'Rechercher une boisson...', it: 'Cerca bevande...', es: 'Buscar bebidas...', ar: 'ابحث عن المشروبات...' },
  'menu.crafted': { en: 'Crafted to', fr: 'Préparé à la', it: 'Realizzato alla', es: 'Elaborado a la', ar: 'مُحضّر إلى' },
  'menu.perfection': { en: 'Perfection', fr: 'Perfection', it: 'Perfezione', es: 'Perfección', ar: 'الكمال' },
  'menu.tagline': {
    en: 'Explore our signature creations, made with the finest ingredients.',
    it: 'Esplora le nostre creazioni con i migliori ingredienti.',
    es: 'Explora nuestras creaciones con los mejores ingredientes.',
    ar: 'استكشف إبداعاتنا المُحضّرة بأجود المكونات.',
  },
  'menu.premiumSelection': { en: 'Premium Selection', fr: 'Sélection Premium', it: 'Selezione Premium', es: 'Selección Premium', ar: 'تشكيلة مميزة' },
  'menu.all': { en: 'All', fr: 'Tous', it: 'Tutti', es: 'Todos', ar: 'الكل' },
  'menu.noResults': { en: 'No products found.', fr: 'Aucun produit trouvé.', it: 'Nessun prodotto trovato.', es: 'No se encontraron productos.', ar: 'لم يتم العثور على منتجات.' },
  'cart.title': { en: 'Your Order', fr: 'Votre commande', it: 'Il tuo ordine', es: 'Tu pedido', ar: 'طلبك' },
  'cart.empty': { en: 'Your cart is empty', fr: 'Votre panier est vide', it: 'Il tuo carrello è vuoto', es: 'Tu carrito está vacío', ar: 'سلتك فارغة' },
  'cart.emptyHint': { en: 'Add some delicious items!', fr: 'Ajoutez de délicieux articles !', it: 'Aggiungi articoli deliziosi!', es: '¡Añade algo delicioso!', ar: 'أضف بعض العناصر اللذيذة!' },
  'cart.yourName': { en: 'Your name', fr: 'Votre nom', it: 'Il tuo nome', es: 'Tu nombre', ar: 'اسمك' },
  'cart.tableNumber': { en: 'Table number (e.g. 11)', fr: 'Numéro de table (ex. 11)', it: 'Numero tavolo (es. 11)', es: 'Número de mesa (ej. 11)', ar: 'رقم الطاولة (مثال 11)' },
  'cart.chooseTable': { en: 'Choose your table', fr: 'Choisissez votre table', it: 'Scegli il tuo tavolo', es: 'Elige tu mesa', ar: 'اختر طاولتك' },
  'cart.loyaltyOptional': { en: '★ Name/phone to earn VIP points (optional)', fr: '★ Nom/téléphone pour gagner des points VIP (optionnel)', it: '★ Nome/telefono per punti VIP (opzionale)', es: '★ Nombre/teléfono para puntos VIP (opcional)', ar: '★ الاسم/الهاتف لكسب نقاط VIP (اختياري)' },
  'cart.notePlaceholder': {
    en: 'Add a note (e.g. no sugar, extra hot, oat milk...)',
    it: 'Aggiungi una nota (es. senza zucchero, extra caldo, latte d’avena...)',
    es: 'Añadir nota (ej. sin azúcar, muy caliente, leche de avena...)',
    ar: 'أضف ملاحظة (مثال: بدون سكر، ساخن جداً، حليب الشوفان...)',
  },
  'cart.placeOrder': { en: 'Place Order', fr: 'Commander', it: 'Conferma ordine', es: 'Realizar pedido', ar: 'تأكيد الطلب' },
  'cart.goCheckout': { en: 'Go to Checkout', fr: 'Passer au paiement', it: 'Vai al checkout', es: 'Ir al checkout', ar: 'إتمام الطلب' },
  'cart.review': { en: 'Review your order', fr: 'Vérifiez votre commande', it: 'Rivedi il tuo ordine', es: 'Revisa tu pedido', ar: 'راجع طلبك' },
  'cart.eachPrice': { en: 'each', fr: 'l’unité', it: 'cad.', es: 'c/u', ar: 'للوحدة' },
  'cart.itemCount': { en: 'item', fr: 'article', it: 'articolo', es: 'artículo', ar: 'عنصر' },
  'cart.itemsCount': { en: 'items', fr: 'articles', it: 'articoli', es: 'artículos', ar: 'عناصر' },
  'order.confirmed': { en: 'Order Confirmed!', fr: 'Commande confirmée !', it: 'Ordine Confermato!', es: '¡Pedido Confirmado!', ar: 'تم تأكيد الطلب!' },
  'order.confirmedHint': { en: 'Your order has been placed successfully.', fr: 'Votre commande a été enregistrée avec succès.', it: 'Il tuo ordine è stato registrato.', es: 'Tu pedido se ha registrado correctamente.', ar: 'تم تسجيل طلبك بنجاح.' },
  'order.orderId': { en: 'Order ID', fr: 'N° de commande', it: 'ID Ordine', es: 'ID del Pedido', ar: 'رقم الطلب' },
  'order.orderMore': { en: 'Order More', fr: 'Commander encore', it: 'Altri ordini', es: 'Pedir más', ar: 'اطلب المزيد' },
  'order.trackOrder': { en: 'Track Order', fr: 'Suivre la commande', it: 'Traccia ordine', es: 'Seguir pedido', ar: 'تتبع الطلب' },

  // Track Order
  'track.title': { en: 'Track Your Order', fr: 'Suivez votre commande', it: 'Traccia il tuo ordine', es: 'Sigue tu pedido', ar: 'تتبع طلبك' },
  'track.welcome': { en: 'Welcome Back!', fr: 'Bon retour !', it: 'Bentornato!', es: '¡Bienvenido de nuevo!', ar: 'مرحبًا بعودتك!' },
  'track.enterName': { en: 'Enter your name to see your active orders.', fr: 'Entrez votre nom pour voir vos commandes en cours.', it: 'Inserisci il tuo nome per vedere i tuoi ordini.', es: 'Ingresa tu nombre para ver tus pedidos.', ar: 'أدخل اسمك لرؤية طلباتك النشطة.' },
  'track.seeMyOrders': { en: 'See My Orders', fr: 'Voir mes commandes', it: 'Mostra i miei ordini', es: 'Ver mis pedidos', ar: 'عرض طلباتي' },
  'track.myOrders': { en: 'My Orders', fr: 'Mes commandes', it: 'I miei ordini', es: 'Mis pedidos', ar: 'طلباتي' },
  'track.hello': { en: 'Hello', fr: 'Bonjour', it: 'Ciao', es: 'Hola', ar: 'مرحبا' },
  'track.noOrders': { en: "You haven't placed any orders yet.", fr: "Vous n'avez pas encore passé de commande.", it: 'Non hai ancora effettuato ordini.', es: 'Aún no has hecho pedidos.', ar: 'لم تقم بأي طلبات بعد.' },
  'track.browseMenu': { en: 'Browse Menu', fr: 'Voir le menu', it: 'Sfoglia il menu', es: 'Ver el menú', ar: 'تصفح القائمة' },
  'track.backToOrders': { en: 'Back to my orders', fr: 'Retour à mes commandes', it: 'Torna ai miei ordini', es: 'Volver a mis pedidos', ar: 'العودة إلى طلباتي' },
  'track.progress': { en: 'Order Progress', fr: 'Progression de la commande', it: 'Stato dell’ordine', es: 'Progreso del pedido', ar: 'حالة الطلب' },
  'track.customer': { en: 'Customer', fr: 'Client', it: 'Cliente', es: 'Cliente', ar: 'الزبون' },
  'track.readyTitle': { en: 'Your order is ready! 🎉', fr: 'Votre commande est prête ! 🎉', it: 'Il tuo ordine è pronto! 🎉', es: '¡Tu pedido está listo! 🎉', ar: 'طلبك جاهز! 🎉' },
  'track.readyBody1': { en: 'Please go to the', fr: 'Veuillez vous rendre auprès du', it: 'Vai alla', es: 'Por favor ve a la', ar: 'يرجى التوجه إلى' },
  'track.readyCashier': { en: 'waiter', fr: 'serveur', it: 'cameriere', es: 'camarero', ar: 'النادل' },
  'track.readyBody2': { en: 'to pay', fr: 'pour payer', it: 'per pagare', es: 'para pagar', ar: 'للدفع' },
  'track.readyBody3': { en: 'and collect your order.', fr: 'et récupérer votre commande.', it: 'e ritirare il tuo ordine.', es: 'y recoger tu pedido.', ar: 'واستلام طلبك.' },
  'track.goPay': { en: 'Go pay at waiter', fr: 'Payer auprès du serveur', it: 'Paga al cameriere', es: 'Paga al camarero', ar: 'ادفع للنادل' },
  'track.trackAnother': { en: 'Track Another', fr: 'Suivre une autre', it: 'Traccia un altro', es: 'Seguir otro', ar: 'تتبع آخر' },
  'track.orderMore': { en: 'Order More', fr: 'Commander encore', it: 'Altri ordini', es: 'Pedir más', ar: 'اطلب المزيد' },
  // Status step labels & descriptions
  'status.pending': { en: 'Pending', fr: 'En attente', it: 'In attesa', es: 'Pendiente', ar: 'قيد الانتظار' },
  'status.preparation': { en: 'In Preparation', fr: 'En préparation', it: 'In preparazione', es: 'En preparación', ar: 'قيد التحضير' },
  'status.ready': { en: 'Ready', fr: 'Prête', it: 'Pronto', es: 'Listo', ar: 'جاهز' },
  'status.paid': { en: 'Paid', fr: 'Payée', it: 'Pagato', es: 'Pagado', ar: 'مدفوع' },
  'step.received': { en: 'Order Received', fr: 'Commande reçue', it: 'Ordine ricevuto', es: 'Pedido recibido', ar: 'تم استلام الطلب' },
  'step.receivedDesc': { en: 'Your order has been placed and is awaiting processing.', fr: 'Votre commande a été enregistrée et attend son traitement.', it: 'Il tuo ordine è stato registrato ed è in attesa.', es: 'Tu pedido ha sido registrado y está en espera.', ar: 'تم تسجيل طلبك وهو قيد المعالجة.' },
  'step.prepDesc': { en: 'Our barista is crafting your drinks with care.', fr: 'Notre barista prépare vos boissons avec soin.', it: 'Il nostro barista sta preparando le tue bevande.', es: 'Nuestro barista está preparando tus bebidas.', ar: 'الباريستا يقوم بتحضير مشروباتك بعناية.' },
  'step.readyPickup': { en: 'Your command on the way', fr: 'Votre commande arrive', it: 'Il tuo ordine è in arrivo', es: 'Tu pedido está en camino', ar: 'طلبك في الطريق' },
  'step.readyDesc': { en: 'Your order is ready! Please proceed to the waiter to pay and collect.', fr: 'Votre commande est prête ! Rendez-vous auprès du serveur pour payer et récupérer.', it: 'Il tuo ordine è pronto! Vai alla cassa per pagare e ritirare.', es: 'Tu pedido está listo. Ve a la caja para pagar y recoger.', ar: 'طلبك جاهز! يرجى التوجه إلى الكاشير للدفع والاستلام.' },
  'step.paidConfirmed': { en: 'Payment Confirmed', fr: 'Paiement confirmé', it: 'Pagamento confermato', es: 'Pago confirmado', ar: 'تم تأكيد الدفع' },
  'step.paidDesc': { en: 'Payment successful. Enjoy your premium coffee!', fr: 'Paiement réussi. Savourez votre café premium !', it: 'Pagamento riuscito. Goditi il tuo caffè premium!', es: 'Pago exitoso. ¡Disfruta tu café premium!', ar: 'تمت عملية الدفع بنجاح. استمتع بقهوتك الفاخرة!' },

  // Support
  'support.title': { en: 'Support', fr: 'Assistance', it: 'Supporto', es: 'Soporte', ar: 'الدعم' },
  'support.contactOwner': { en: 'Contact the Owner', fr: 'Contacter le propriétaire', it: 'Contatta il proprietario', es: 'Contactar al propietario', ar: 'تواصل مع المالك' },
  'support.intro': {
    en: 'Have a request or a complaint? Send it and the owner will chat with you live.',
    it: 'Hai una richiesta o un reclamo? Inviala e il proprietario chatterà con te dal vivo.',
    es: '¿Tienes una solicitud o queja? Envíala y el propietario chateará contigo en vivo.',
    ar: 'هل لديك طلب أو شكوى؟ أرسلها وسيقوم المالك بالدردشة معك مباشرة.',
  },
  'support.subject': { en: 'Subject (e.g. Cold coffee, Refund...)', fr: 'Sujet (ex. Café froid, Remboursement...)', it: 'Oggetto (es. Caffè freddo, Rimborso...)', es: 'Asunto (ej. Café frío, Reembolso...)', ar: 'الموضوع (مثال: قهوة باردة، استرداد...)' },
  'support.message': { en: 'Describe your request or complaint...', fr: 'Décrivez votre demande ou réclamation...', it: 'Descrivi la tua richiesta o reclamo...', es: 'Describe tu solicitud o queja...', ar: 'صف طلبك أو شكواك...' },
  'support.sendRequest': { en: 'Send Request', fr: 'Envoyer la demande', it: 'Invia richiesta', es: 'Enviar solicitud', ar: 'إرسال الطلب' },
  'support.myRequests': { en: 'My Requests', fr: 'Mes demandes', it: 'Le mie richieste', es: 'Mis solicitudes', ar: 'طلباتي' },
  'support.noRequests': { en: 'No requests yet.', fr: 'Aucune demande.', it: 'Nessuna richiesta.', es: 'Sin solicitudes aún.', ar: 'لا توجد طلبات بعد.' },
  'support.backRequests': { en: 'Back to my requests', fr: 'Retour à mes demandes', it: 'Torna alle mie richieste', es: 'Volver a mis solicitudes', ar: 'العودة إلى طلباتي' },
  'support.chatOwner': { en: 'Chat with Owner', fr: 'Discuter avec le propriétaire', it: 'Chatta con il proprietario', es: 'Chatear con el propietario', ar: 'الدردشة مع المالك' },
  'support.pendingMsg': {
    en: 'Your request is pending. The owner will open a live chat once they accept it.',
    it: 'La tua richiesta è in attesa. Il proprietario aprirà una chat dal vivo una volta accettata.',
    es: 'Tu solicitud está pendiente. El propietario abrirá un chat en vivo cuando la acepte.',
    ar: 'طلبك قيد المراجعة. سيفتح المالك دردشة مباشرة بمجرد قبوله.',
  },
  'support.chatAcceptedHint': { en: 'The owner accepted your request. Start chatting!', fr: 'Le propriétaire a accepté votre demande. Commencez à discuter !', it: 'Il proprietario ha accettato. Inizia a chattare!', es: 'El propietario aceptó. ¡Comienza a chatear!', ar: 'قبل المالك طلبك. ابدأ الدردشة!' },
} as const;

export type TranslationKey = keyof typeof T;
