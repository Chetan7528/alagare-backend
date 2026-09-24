'use strict';

const TERMS_TITLE_EN = 'Terms of Service';
const TERMS_TITLE_FR = "Conditions Générales d'Utilisation";

const TERMS_BODY_EN = `<p>Welcome to <strong>Alagare</strong>. By creating an account or booking a bus ticket through our mobile app, you agree to these Terms of Service.</p>
<h3>1. About our service</h3>
<p>Alagare is a bus booking platform that lets you search routes, compare operators, select seats, and book intercity and local bus travel. We connect you with transport operators on the Alagare network.</p>
<h3>2. Account registration</h3>
<p>You must provide accurate name, email, and phone details. You are responsible for keeping your login credentials secure. You must be at least 18 years old (or have a parent/guardian’s consent) to book tickets.</p>
<h3>3. Bookings and payments</h3>
<p>A booking is confirmed only after successful payment and confirmation from the operator. Fares, taxes, and fees shown at checkout are payable at the time of booking unless otherwise stated. Please review trip details, boarding point, and seat selection before paying.</p>
<h3>4. Cancellations and refunds</h3>
<p>Cancellation and refund rules depend on the operator and fare type selected. Partial or no refund may apply for late cancellations, no-shows, or promotional fares. Refund timelines follow the payment method and operator policy.</p>
<h3>5. Travel and conduct</h3>
<p>Arrive at the boarding point with enough time and a valid ticket (in-app or SMS/email). Follow operator safety rules. Alagare is not liable for delays caused by traffic, weather, mechanical issues, or force majeure, though we will help you with support where possible.</p>
<h3>6. Acceptable use</h3>
<p>You agree not to misuse the app, attempt fraud, scrape data, or interfere with other users or operators. We may suspend accounts that violate these terms.</p>
<h3>7. Changes</h3>
<p>We may update these Terms to reflect new features or legal requirements. Continued use of the app after updates means you accept the revised Terms.</p>
<h3>8. Contact</h3>
<p>For booking help or disputes, use Help &amp; Support in the Alagare app or contact <strong>support@alagare.com</strong>.</p>
<p><em>Last updated: July 2026</em></p>`;

const TERMS_BODY_FR = `<p>Bienvenue sur <strong>Alagare</strong>. En créant un compte ou en réservant un billet de bus via notre application mobile, vous acceptez les présentes Conditions Générales d'Utilisation.</p>
<h3>1. À propos de notre service</h3>
<p>Alagare est une plateforme de réservation de billets de bus vous permettant de rechercher des trajets, de comparer les transporteurs, de choisir vos sièges et de réserver vos voyages en bus locaux et interurbains. Nous vous connectons aux opérateurs de transport partenaires du réseau Alagare.</p>
<h3>2. Création et gestion de compte</h3>
<p>Vous devez fournir des informations exactes (nom, e-mail et numéro de téléphone). Vous êtes responsable de la confidentialité de vos identifiants de connexion. Vous devez avoir au moins 18 ans (ou disposer de l'accord d'un représentant légal) pour réserver un billet.</p>
<h3>3. Réservations et paiements</h3>
<p>Une réservation n'est définitivement confirmée qu'après validation du paiement et confirmation par le transporteur. Les tarifs, taxes et frais indiqués au moment du paiement sont exigibles immédiatement. Veuillez vérifier l'exactitude de vos détails de trajet, du lieu d'embarquement et du choix des sièges avant de payer.</p>
<h3>4. Annulations et remboursements</h3>
<p>Les conditions d'annulation et de remboursement dépendent de la politique du transporteur et du type de tarif choisi. Des frais d'annulation ou une absence de remboursement peuvent s'appliquer en cas d'annulation tardive ou de non-présentation au départ.</p>
<h3>5. Voyage et sécurité</h3>
<p>Présentez-vous au point d'embarquement à l'avance muni d'un titre de transport valide (QR code dans l'application ou SMS/e-mail) et d'une pièce d'identité. Respectez les consignes de sécurité du transporteur. Alagare ne saurait être tenue responsable des retards causés par les conditions de circulation, la météo ou la force majeure.</p>
<h3>6. Utilisation conforme</h3>
<p>Vous vous engagez à ne pas utiliser l'application à des fins frauduleuses ou illicites. Nous nous réservons le droit de suspendre tout compte enfreignant ces règles.</p>
<h3>7. Modifications des conditions</h3>
<p>Nous pouvons mettre à jour ces conditions afin de refléter de nouvelles fonctionnalités ou exigences réglementaires. L'utilisation continue du service vaut acceptation des conditions révisées.</p>
<h3>8. Contact & Assistance</h3>
<p>Pour toute question ou réclamation relative à une réservation, contactez notre support via l'application ou à <strong>support@alagare.com</strong>.</p>
<p><em>Dernière mise à jour : Juillet 2026</em></p>`;

const PRIVACY_TITLE_EN = 'Privacy Policy';
const PRIVACY_TITLE_FR = 'Politique de Confidentialité';

const PRIVACY_BODY_EN = `<p><strong>Alagare</strong> respects your privacy. This Privacy Policy explains what we collect, how we use it, and your choices when you use our bus booking app.</p>
<h3>1. Information we collect</h3>
<ul>
<li>Account details: name, email, phone number, and profile photo (if you upload one).</li>
<li>Booking details: routes, seats, passenger info, payment references, and travel history.</li>
<li>Device and usage data: app version, device type, approximate location (if you allow it for maps), and crash/diagnostics data to improve reliability.</li>
<li>Support messages you send to customer care.</li>
</ul>
<h3>2. How we use your information</h3>
<p>We use your data to create and manage your account, process bookings, send tickets and trip updates, show maps and boarding points, improve the app, prevent fraud, and respond to support requests.</p>
<h3>3. Sharing</h3>
<p>We share necessary booking details with bus operators to fulfil your trip. Payment processors handle card/UPI transactions securely. We do not sell your personal information. We may share data if required by law or to protect safety and rights.</p>
<h3>4. Data retention</h3>
<p>We keep account and booking records as long as needed for service, legal, and accounting purposes. You may request account deletion from Settings / Support, subject to open bookings and legal retention rules.</p>
<h3>5. Security</h3>
<p>We use industry-standard measures (including encrypted connections and access controls) to protect your data. No method of transmission is 100% secure; please keep your password private.</p>
<h3>6. Your choices</h3>
<p>You can update profile details in the app, control notification preferences, and revoke location permission in device settings. Contact us to access, correct, or delete personal data where applicable.</p>
<h3>7. Children</h3>
<p>Our service is not directed at children under 13. If you believe a child has provided data, contact us and we will take appropriate steps.</p>
<h3>8. Updates</h3>
<p>We may update this Policy from time to time. Material changes will be reflected in the app. Continued use means you acknowledge the updated Policy.</p>
<h3>9. Contact</h3>
<p>Privacy questions: <strong>privacy@alagare.com</strong> or Help &amp; Support in the Alagare app.</p>
<p><em>Last updated: July 2026</em></p>`;

const PRIVACY_BODY_FR = `<p><strong>Alagare</strong> respecte votre vie privée. Cette Politique de Confidentialité décrit les données que nous collectons, la manière dont nous les utilisons et vos droits lorsque vous utilisez notre service de réservation de bus.</p>
<h3>1. Informations que nous collectons</h3>
<ul>
<li>Informations de compte : nom complet, adresse e-mail, numéro de téléphone et photo de profil (facultative).</li>
<li>Détails des réservations : trajets, sièges sélectionnés, informations passagers, historiques et reçus de paiement.</li>
<li>Données techniques et d'utilisation : version de l'application, type d'appareil, localisation approximative (si autorisée) et rapports de performance pour assurer la fiabilité du service.</li>
<li>Messages et réclamations adressés au support client.</li>
</ul>
<h3>2. Utilisation de vos données</h3>
<p>Vos données sont utilisées pour créer et gérer votre compte, traiter vos réservations, générer vos billets électroniques, vous notifier des mises à jour de voyage, prévenir les fraudes et répondre à vos demandes d'assistance.</p>
<h3>3. Partage des données</h3>
<p>Nous transmettons les détails nécessaires à la réalisation de votre voyage aux compagnies de bus partenaires. Les paiements sont sécurisés par des prestataires de paiement certifiés. Nous ne vendons en aucun cas vos données personnelles à des tiers.</p>
<h3>4. Conservation et suppression</h3>
<p>Nous conservons vos données uniquement pendant la durée nécessaire aux finalités du service et aux obligations légales. Vous pouvez demander la suppression de votre compte et de vos données à tout moment depuis les Paramètres de l'application.</p>
<h3>5. Sécurité</h3>
<p>Nous appliquons des protocoles de sécurité stricts, notamment le chiffrement SSL de bout en bout et des contrôles d'accès rigoureux pour protéger vos informations.</p>
<h3>6. Vos droits</h3>
<p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez gérer vos préférences de notification et vos autorisations directement dans l'application.</p>
<h3>7. Contact DPO & Vie Privée</h3>
<p>Pour toute demande concernant la protection de vos données, écrivez-nous à <strong>privacy@alagare.com</strong> ou via la rubrique Aide & Support.</p>
<p><em>Dernière mise à jour : Juillet 2026</em></p>`;

const OPERATOR_TERMS_TITLE_EN = 'Operator Terms of Service';
const OPERATOR_TERMS_TITLE_FR = 'Conditions Générales Partenaires Transporteurs';

const OPERATOR_TERMS_BODY_EN = `<p>Welcome to <strong>Alagare Operator Portal</strong>. By registering as a bus operator or managing routes on our platform, you agree to these Terms of Service.</p>
<h3>1. Operator Registration & Approval</h3>
<p>All bus operators must submit valid company registration, operating permits, vehicle insurance, and bank details. Alagare reserves the right to approve, reject, or suspend any operator application following compliance verification.</p>
<h3>2. Fleet, Schedules & Seat Management</h3>
<p>Operators are responsible for maintaining accurate route details, departure times, bus types, seat availability, and fare pricing. Any schedule modification or cancellation must be updated promptly to inform passengers.</p>
<h3>3. Commission & Settlement Payouts</h3>
<p>Alagare deducts a standard platform commission per successful booking. Net earnings are transferred automatically to the operator's registered bank account according to the agreed payout cycle.</p>
<h3>4. Safety, Standards & Passenger Service</h3>
<p>Operators must ensure that all buses are roadworthy, clean, fully insured, and operated by licensed drivers. Boarding gate controllers must honor digital QR tickets issued through the Alagare platform.</p>
<h3>5. Limitation of Liability</h3>
<p>Alagare acts as a digital marketplace connecting passengers with transport operators. Operators remain solely liable for vehicle maintenance, passenger safety during transit, and route compliance under local transport laws.</p>
<h3>6. Term & Termination</h3>
<p>Either party may terminate the partnership upon written notice. Open bookings must be honored prior to account closure.</p>
<p><em>Last updated: July 2026</em></p>`;

const OPERATOR_TERMS_BODY_FR = `<p>Bienvenue sur le <strong>Portail Partenaires Transporteurs Alagare</strong>. En vous inscrivant en tant que compagnie de transport ou en gérant des trajets sur notre plateforme, vous acceptez les présentes Conditions Générales Partenaires.</p>
<h3>1. Inscription et Validation des Transporteurs</h3>
<p>Tous les transporteurs doivent fournir des documents d'immatriculation valides, leurs autorisations d'exploitation, assurances véhicules et coordonnées bancaires. Alagare se réserve le droit de valider, refuser ou suspendre tout compte après examen de conformité.</p>
<h3>2. Gestion de la Flotte, des Horaires et des Tarifs</h3>
<p>Les transporteurs sont responsables de l'exactitude des informations relatives à leurs lignes, horaires de départ, configurations de sièges et grilles tarifaires. Toute modification ou annulation doit être immédiatement répercutée pour informer les passagers.</p>
<h3>3. Commission de Plateforme et Versements</h3>
<p>Alagare applique une commission standard par réservation confirmée. Les gains nets sont automatiquement versés sur le compte bancaire enregistré selon le calendrier de versement convenu (hebdomadaire ou bimensuel).</p>
<h3>4. Normes de Sécurité et Qualité de Service</h3>
<p>Les transporteurs doivent garantir le parfait état des véhicules, la validité des assurances et la conformité des permis des conducteurs. Les contrôleurs à l'embarquement doivent valider les billets QR numériques émis par Alagare.</p>
<h3>5. Responsabilité</h3>
<p>Alagare agit en tant que place de marché numérique connectant passagers et transporteurs. Le transporteur demeure seul responsable de l'exécution du transport et de la sécurité des passagers à bord.</p>
<p><em>Dernière mise à jour : Juillet 2026</em></p>`;

const OPERATOR_PRIVACY_TITLE_EN = 'Operator Privacy Policy';
const OPERATOR_PRIVACY_TITLE_FR = 'Politique de Confidentialité Partenaires';

const OPERATOR_PRIVACY_BODY_EN = `<p><strong>Alagare</strong> respects the privacy of our partner bus operators. This Privacy Policy explains what information we collect, how we use it, and your choices when you interact with our platform.</p>
<h3>1. Information We Collect</h3>
<ul>
  <li><strong>Account & Business Information:</strong> Operator name, company registration, contact person details, email address, phone number, and banking details for payout settlement.</li>
  <li><strong>Fleet & Route Data:</strong> Bus registration details, seat configurations, schedules, pricing, and route permits.</li>
  <li><strong>Usage & Analytics:</strong> IP address, device type, browser information, and access logs to maintain system security and optimize portal performance.</li>
</ul>
<h3>2. How We Use Information</h3>
<p>We use the collected information to verify operator applications, enable fleet management, process passenger bookings, issue automated payouts, provide customer support, and comply with transport regulations.</p>
<h3>3. Data Sharing & Security</h3>
<p>We do not sell operator or user personal data. Information is shared strictly with authorized payment processors, mapping services, and legal authorities when required by law. We employ industry-standard SSL encryption and secure data hosting.</p>
<h3>4. Your Rights & Choices</h3>
<p>Operators may review and update their company profile and contact details at any time from their operator dashboard. For account deletion or data inquiry, please contact our support team.</p>
<h3>5. Policy Updates</h3>
<p>We may update this Privacy Policy periodically. Continued use of our portal signifies acceptance of any updated terms.</p>
<p><em>Last updated: July 2026</em></p>`;

const OPERATOR_PRIVACY_BODY_FR = `<p><strong>Alagare</strong> s'engage à protéger la confidentialité des données de ses transporteurs partenaires. Cette politique détaille nos pratiques concernant la collecte et le traitement de vos informations professionnelles.</p>
<h3>1. Données Collectées</h3>
<ul>
  <li><strong>Informations d'Entreprise :</strong> Raison sociale, immatriculation commerciale, coordonnées des responsables, e-mail, téléphone et coordonnées bancaires pour les versements.</li>
  <li><strong>Données d'Exploitation :</strong> Immatriculation des bus, configurations de sièges, lignes, tarifs et plannings de trajet.</li>
  <li><strong>Données de Connexion :</strong> Adresse IP, logs d'accès et statistiques d'utilisation du portail pour sécuriser la plateforme.</li>
</ul>
<h3>2. Finalités du Traitement</h3>
<p>Ces données permettent la vérification de conformité, l'attribution des réservations, l'automatisation des virements de revenus et la communication opérationnelle.</p>
<h3>3. Sécurité & Confidentialité</h3>
<p>Les données financières et opérationnelles sont chiffrées et hébergées sur des infrastructures hautement sécurisées. Aucun partage commercial n'est effectué.</p>
<p><em>Dernière mise à jour : Juillet 2026</em></p>`;

const FAQ_DEFAULTS = [
  {
    questionEn: 'How do I book a bus ticket on Alagare?',
    answerEn:
      'Open the app, choose From and To cities, pick your travel date, select a bus and seats, then complete payment. You will get a confirmation with your booking ID.',
    questionFr: 'Comment réserver un billet de bus sur Alagare ?',
    answerFr:
      'Ouvrez l’application, choisissez les villes de départ et d’arrivée, sélectionnez votre date de voyage, choisissez votre bus et vos sièges, puis effectuez le paiement pour recevoir votre confirmation instantanée.',
    question: 'How do I book a bus ticket on Alagare?',
    answer:
      'Open the app, choose From and To cities, pick your travel date, select a bus and seats, then complete payment. You will get a confirmation with your booking ID.',
  },
  {
    questionEn: 'Can I cancel my ticket and get a refund?',
    answerEn:
      'Yes. Go to My Bookings, open your ticket, and choose Cancel if the fare rules allow it. Refund amount and time depend on the operator and how close you are to departure.',
    questionFr: 'Puis-je annuler mon billet et obtenir un remboursement ?',
    answerFr:
      'Oui. Rendez-vous dans "Mes Réservations", ouvrez votre billet et appuyez sur Annuler si les conditions tarifaires le permettent. Le montant remboursé dépend de la politique du transporteur.',
    question: 'Can I cancel my ticket and get a refund?',
    answer:
      'Yes. Go to My Bookings, open your ticket, and choose Cancel if the fare rules allow it. Refund amount and time depend on the operator and how close you are to departure.',
  },
  {
    questionEn: 'Where can I find my boarding point?',
    answerEn:
      'Open the confirmed booking in My Bookings. Boarding point, gate, and reporting time are shown on the trip details screen.',
    questionFr: 'Où puis-je trouver mon point d’embarquement ?',
    answerFr:
      'Ouvrez votre réservation confirmée dans "Mes Réservations". Le point de prise en charge, la porte et l’heure de convocation sont indiqués sur l’écran de détails du voyage.',
    question: 'Where can I find my boarding point?',
    answer:
      'Open the confirmed booking in My Bookings. Boarding point, gate, and reporting time are shown on the trip details screen.',
  },
  {
    questionEn: 'I paid but did not get a ticket. What should I do?',
    answerEn:
      'Check My Bookings first. If the ticket is missing, raise an inquiry under Help & Support with your payment reference and registered email. Our team usually replies within 24 hours.',
    questionFr: 'J’ai payé mais je n’ai pas reçu mon billet. Que faire ?',
    answerFr:
      'Vérifiez d’abord dans "Mes Réservations". Si le billet n’apparaît pas, soumettez une réclamation dans "Aide & Support" avec votre référence de paiement. Notre équipe vous répondra rapidement.',
    question: 'I paid but did not get a ticket. What should I do?',
    answer:
      'Check My Bookings first. If the ticket is missing, raise an inquiry under Help & Support with your payment reference and registered email. Our team usually replies within 24 hours.',
  },
  {
    questionEn: 'How do I change my profile details?',
    answerEn:
      'Go to Profile → Personal Info to update your name, phone number, and photo. Email is used for login and cannot be changed from the app.',
    questionFr: 'Comment modifier mes informations de profil ?',
    answerFr:
      'Rendez-vous dans Profil → Informations Personnelles pour mettre à jour votre nom, numéro de téléphone et photo. L’adresse e-mail sert d’identifiant et ne peut être modifiée depuis l’application.',
    question: 'How do I change my profile details?',
    answer:
      'Go to Profile → Personal Info to update your name, phone number, and photo. Email is used for login and cannot be changed from the app.',
  },
  {
    questionEn: 'Is my payment information safe?',
    answerEn:
      'Payments are processed through secure payment partners. Alagare does not store your full card or UPI PIN. Never share OTPs or passwords with anyone.',
    questionFr: 'Mes informations de paiement sont-elles sécurisées ?',
    answerFr:
      'Tous les paiements sont traités par des prestataires bancaires certifiés et hautement sécurisés. Alagare ne conserve jamais vos numéros complets de carte bancaire ni vos codes secrets.',
    question: 'Is my payment information safe?',
    answer:
      'Payments are processed through secure payment partners. Alagare does not store your full card or UPI PIN. Never share OTPs or passwords with anyone.',
  },
];

const OPERATOR_FAQ_DEFAULTS = [
  {
    questionEn: 'How do I register my bus company on Alagare?',
    answerEn:
      'Fill out the registration form on our Operator Portal with your company details, operating permits, and contact info. Our onboarding team will verify your credentials and activate your account within 24 hours.',
    questionFr: 'Comment inscrire ma compagnie de bus sur Alagare ?',
    answerFr:
      'Remplissez le formulaire d’inscription sur le Portail Partenaires avec les détails de votre entreprise, licences d’exploitation et coordonnées. Notre équipe vérifiera vos documents et activera votre compte sous 24h.',
    question: 'How do I register my bus company on Alagare?',
    answer:
      'Fill out the registration form on our Operator Portal with your company details, operating permits, and contact info. Our onboarding team will verify your credentials and activate your account within 24 hours.',
  },
  {
    questionEn: 'How do payout settlements work for operators?',
    answerEn:
      'Earnings from confirmed passenger bookings minus our standard platform commission are automatically disbursed to your registered bank account on a weekly or bi-weekly cycle.',
    questionFr: 'Comment fonctionnent les versements de revenus aux transporteurs ?',
    answerFr:
      'Les revenus issus des réservations passagers confirmées (déduction faite de la commission de plateforme) sont virés automatiquement sur votre compte bancaire enregistré selon le cycle choisi.',
    question: 'How do payout settlements work for operators?',
    answer:
      'Earnings from confirmed passenger bookings minus our standard platform commission are automatically disbursed to your registered bank account on a weekly or bi-weekly cycle.',
  },
  {
    questionEn: 'How do I manage bus routes, schedules, and pricing?',
    answerEn:
      'Logged-in operators can use the Fleet & Routes section in the Operator Panel to add new buses, set departure/arrival times, configure seating layouts (sleeper/seater), and adjust fare prices in real time.',
    questionFr: 'Comment gérer mes lignes de bus, horaires et tarifs ?',
    answerFr:
      'Les transporteurs connectés peuvent utiliser la section Flotte & Lignes de leur portail pour ajouter des bus, définir les horaires de départ, configurer les plans de sièges et ajuster les prix en temps réel.',
    question: 'How do I manage bus routes, schedules, and pricing?',
    answer:
      'Logged-in operators can use the Fleet & Routes section in the Operator Panel to add new buses, set departure/arrival times, configure seating layouts (sleeper/seater), and adjust fare prices in real time.',
  },
  {
    questionEn: 'How does digital QR ticket validation work at boarding gates?',
    answerEn:
      'Boarding gate staff can use the Alagare Gate Scanner app to scan passenger digital QR tickets. The system verifies ticket validity instantly and prevents duplicate boarding.',
    questionFr: 'Comment fonctionne la validation des billets QR à l’embarquement ?',
    answerFr:
      'Les agents d’embarquement utilisent l’application Alagare Gate Scanner pour scanner les QR codes des passagers. Le système valide immédiatement le billet et prévient les doublons.',
    question: 'How does digital QR ticket validation work at boarding gates?',
    answer:
      'Boarding gate staff can use the Alagare Gate Scanner app to scan passenger digital QR tickets. The system verifies ticket validity instantly and prevents duplicate boarding.',
  },
  {
    questionEn: 'What documents are required to complete operator onboarding?',
    answerEn:
      'You will need a valid Commercial Bus Registration, Route Operating Permit, Vehicle Insurance Certificate, GST/Tax ID, and Bank Account statement for payout setup.',
    questionFr: 'Quels documents sont requis pour finaliser l’inscription d’un transporteur ?',
    answerFr:
      'Vous devez fournir : Immatriculation commerciale, Licence d’exploitation de ligne, Attestation d’assurance véhicule, Identifiant fiscal/TVA et Relevé d’Identité Bancaire (RIB).',
    question: 'What documents are required to complete operator onboarding?',
    answer:
      'You will need a valid Commercial Bus Registration, Route Operating Permit, Vehicle Insurance Certificate, GST/Tax ID, and Bank Account statement for payout setup.',
  },
];

const APP_CONTENT_DEFAULT = {
  termsTitleEn: TERMS_TITLE_EN,
  termsTitleFr: TERMS_TITLE_FR,
  termsTitle: TERMS_TITLE_EN,
  termsBodyEn: TERMS_BODY_EN,
  termsBodyFr: TERMS_BODY_FR,
  termsBody: TERMS_BODY_EN,

  privacyTitleEn: PRIVACY_TITLE_EN,
  privacyTitleFr: PRIVACY_TITLE_FR,
  privacyTitle: PRIVACY_TITLE_EN,
  privacyBodyEn: PRIVACY_BODY_EN,
  privacyBodyFr: PRIVACY_BODY_FR,
  privacyBody: PRIVACY_BODY_EN,

  operatorTermsTitleEn: OPERATOR_TERMS_TITLE_EN,
  operatorTermsTitleFr: OPERATOR_TERMS_TITLE_FR,
  operatorTermsTitle: OPERATOR_TERMS_TITLE_EN,
  operatorTermsBodyEn: OPERATOR_TERMS_BODY_EN,
  operatorTermsBodyFr: OPERATOR_TERMS_BODY_FR,
  operatorTermsBody: OPERATOR_TERMS_BODY_EN,

  operatorPrivacyTitleEn: OPERATOR_PRIVACY_TITLE_EN,
  operatorPrivacyTitleFr: OPERATOR_PRIVACY_TITLE_FR,
  operatorPrivacyTitle: OPERATOR_PRIVACY_TITLE_EN,
  operatorPrivacyBodyEn: OPERATOR_PRIVACY_BODY_EN,
  operatorPrivacyBodyFr: OPERATOR_PRIVACY_BODY_FR,
  operatorPrivacyBody: OPERATOR_PRIVACY_BODY_EN,

  faqs: FAQ_DEFAULTS,
  operatorFaqs: OPERATOR_FAQ_DEFAULTS,
};

module.exports = {
  APP_CONTENT_DEFAULT,
  TERMS_TITLE_EN,
  TERMS_TITLE_FR,
  TERMS_BODY_EN,
  TERMS_BODY_FR,
  TERMS_BODY: TERMS_BODY_EN,
  PRIVACY_TITLE_EN,
  PRIVACY_TITLE_FR,
  PRIVACY_BODY_EN,
  PRIVACY_BODY_FR,
  PRIVACY_BODY: PRIVACY_BODY_EN,
  OPERATOR_TERMS_TITLE_EN,
  OPERATOR_TERMS_TITLE_FR,
  OPERATOR_TERMS_BODY_EN,
  OPERATOR_TERMS_BODY_FR,
  OPERATOR_TERMS_BODY: OPERATOR_TERMS_BODY_EN,
  OPERATOR_PRIVACY_TITLE_EN,
  OPERATOR_PRIVACY_TITLE_FR,
  OPERATOR_PRIVACY_BODY_EN,
  OPERATOR_PRIVACY_BODY_FR,
  OPERATOR_PRIVACY_BODY: OPERATOR_PRIVACY_BODY_EN,
  FAQ_DEFAULTS,
  OPERATOR_FAQ_DEFAULTS,
};
