/**
 * Branding provisório — centraliza tudo que vai mudar quando o branding final sair.
 * Trocar os valores aqui propaga para o tema Mantine e para as seções.
 */

export const brand = {
  productName: 'Ageendoo',
  tagline: 'Sua agenda fácil, suas comissões no controle',

  // CTA — ajustar número/links reais depois
  whatsappNumber: '5581984229450', // DDI(55)+DDD(81)+numero
  whatsappMessage: 'Olá! Tenho interesse no Ageendoo para o meu negócio.',
  demoUrl: '#contato',

  // Cliente citado na seção de prova social
  anchorClient: 'Maria Borboleta',

  // Cor primária (nome de uma cor do tema Mantine abaixo)
  primaryColor: 'brand',
} as const

export const whatsappLink = `https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(
  brand.whatsappMessage,
)}`
