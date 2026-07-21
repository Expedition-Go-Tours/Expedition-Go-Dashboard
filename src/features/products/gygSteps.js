export const GYG_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  {
    id: 'product-content',
    label: 'Product Content',
    collapsible: true,
    subItems: [
      { id: 'whats-included', label: "What's included?" },
      { id: 'guide-info', label: 'Guide information' },
      { id: 'food', label: 'Food' },
      { id: 'transportation', label: 'Transportation' },
    ],
  },
  { id: 'media', label: 'Media' },
  { id: 'option-setup', label: 'Option Setup' },
  { id: 'itinerary-section', label: 'Itinerary' },
]

export const GYG_STEPS = [
  { id: 1, label: 'Language', sectionId: 'getting-started', stepId: 'language' },
  { id: 2, label: 'Product Category', sectionId: 'getting-started', stepId: 'category' },
  { id: 3, label: 'Title & Reference Code', sectionId: 'getting-started', stepId: 'title' },
  { id: 4, label: 'Descriptions & highlights', sectionId: 'product-content', stepId: 'descriptions' },
  { id: 5, label: 'Locations', sectionId: 'product-content', stepId: 'locations' },
  { id: 6, label: 'Keywords', sectionId: 'product-content', stepId: 'keywords' },
  { id: 7, label: 'Inclusions', sectionId: 'product-content', stepId: 'inclusions' },
  { id: 8, label: 'Guide information', sectionId: 'product-content', stepId: 'guide-info' },
  { id: 9, label: 'Photos', sectionId: 'media', stepId: 'photos' },
  { id: 10, label: 'Extra information', sectionId: 'product-content', stepId: 'extra-info' },
  { id: 11, label: 'Options', sectionId: 'option-setup', stepId: 'options' },
  { id: 12, label: 'Meeting Point or Pickup', sectionId: 'option-setup', stepId: 'meeting-point' },
  { id: 13, label: 'Pricing & Availability', sectionId: 'option-setup', stepId: 'pricing' },
  { id: 14, label: 'Itinerary', sectionId: 'itinerary-section', stepId: 'itinerary' },
]


