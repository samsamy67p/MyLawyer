/**
 * حسابات تجريبية سريعة للتطوير والمعاينة واختبار الواجهات
 */

export const GUEST_CLIENT_USER = {
  id: 'guest',
  phone: '01000000000',
  role: 'client',
  status: 'active',
  isGuest: true,
};

export const DEMO_LAWYER_USER = {
  id: 'demo_lawyer_01',
  fullName: 'المستشار / أحمد فهمي',
  phone: '01012345678',
  email: 'lawyer.demo@mylawyer.eg',
  role: 'lawyer',
  status: 'active',
  isDemo: true,
  rating: 4.95,
  casesCount: 142,
  specialties: ['جنائي', 'مدني', 'شركات'],
  officeAddress: 'شارع جامعة الدول العربية، المهندسين، الجيزة',
};
