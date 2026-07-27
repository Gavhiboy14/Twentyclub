/**
 * Preguntas frecuentes. Vive en un módulo neutral porque lo consumen tanto el
 * acordeón (cliente) como el JSON-LD de la landing (servidor).
 */
export const FAQ_ITEMS = [
  {
    q: "¿Cómo se paga?",
    a: "No hay pago online. Elegís tus pares, tocás «Finalizar por WhatsApp» y se abre el chat con el resumen del pedido ya escrito. Ahí coordinamos el pago: transferencia, efectivo o el medio que te quede cómodo.",
  },
  {
    q: "¿Son originales?",
    a: "Sí. Todos los pares son originales y se revisan uno por uno antes de publicarse. Si algo no coincide con lo que viste, lo cambiamos o te devolvemos el dinero.",
  },
  {
    q: "¿Cuánto tarda el envío?",
    a: "CABA y GBA entre 24 y 48 horas. Al resto del país, de 3 a 5 días hábiles por Correo Argentino o Andreani. Envío sin cargo en compras desde $250.000.",
  },
  {
    q: "¿Puedo cambiar el talle?",
    a: "Sí, dentro de los 15 días de recibido y siempre que el par esté sin uso y con su caja. El cambio de talle no tiene costo adicional en CABA.",
  },
  {
    q: "¿Qué pasa si mi talle está agotado?",
    a: "Los talles sin stock desaparecen del sitio automáticamente, así que lo que ves es lo que hay. Si querés un talle que no aparece, escribinos por WhatsApp y te avisamos cuando vuelva.",
  },
  {
    q: "¿Tienen local para probarse?",
    a: "Trabajamos con showroom a coordinar en Buenos Aires. Escribinos por WhatsApp y armamos un turno para que te pruebes antes de comprar.",
  },
] as const;
