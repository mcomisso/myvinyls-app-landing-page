export const SUPPORTED_LOCALES = ["en", "de", "es", "fr", "it", "ja", "pt", "zh-CN"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const localeByTag = new Map<string, SupportedLocale>([
  ["en", "en"],
  ["de", "de"],
  ["es", "es"],
  ["fr", "fr"],
  ["it", "it"],
  ["ja", "ja"],
  ["pt", "pt"],
  ["zh", "zh-CN"],
  ["zh-cn", "zh-CN"],
  ["zh-hans", "zh-CN"],
  ["zh-sg", "zh-CN"],
]);

export function negotiateLocale(header: string | null): SupportedLocale {
  if (!header || header.length > 1_024) return "en";

  const preferences = header
    .split(",", 32)
    .map((part, order) => parsePreference(part, order))
    .filter((preference): preference is LanguagePreference => preference !== null)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);

  for (const preference of preferences) {
    if (preference.range === "*") return "en";
    const locale = matchLocale(preference.range);
    if (locale) return locale;
  }
  return "en";
}

interface LanguagePreference {
  range: string;
  quality: number;
  order: number;
}

function parsePreference(part: string, order: number): LanguagePreference | null {
  const [rawRange, ...parameters] = part.trim().split(";");
  const range = rawRange.toLowerCase();
  if (!range || (range !== "*" && !/^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/.test(range))) return null;

  let quality = 1;
  for (const parameter of parameters) {
    const match = parameter.trim().match(/^q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i);
    if (!match) return null;
    quality = Number(match[1]);
  }
  return quality > 0 ? { range, quality, order } : null;
}

function matchLocale(range: string): SupportedLocale | undefined {
  const direct = localeByTag.get(range);
  if (direct) return direct;

  const language = range.split("-", 1)[0];
  if (language === "zh") return undefined;
  return localeByTag.get(language);
}

export interface ReleaseCopy {
  releaseFallback: string;
  catalogueRelease: string;
  updated: string;
  publishing: string;
  releaseDestinations: string;
  openInMyVinyl: string;
  viewOnDiscogs: string;
  externalLink: string;
  getMyVinyl: string;
  tracklist: string;
  releaseIdentifiers: string;
  genresAndStyles: string;
  reportThisPage: string;
  privacy: string;
  terms: string;
  homeLabel: string;
  skipToDetails: string;
  retry: string;
  myVinylHome: string;
  notFoundHeading: string;
  notFoundDetail: string;
  goneHeading: string;
  goneDetail: string;
  unavailableHeading: string;
  unavailableDetail: string;
  freshnessDetail: string;
  busyDetail: string;
  reportTitle: string;
  reportQueued: string;
  reportInvalid: string;
  reportReviewNotice: string;
  reason: string;
  chooseReason: string;
  privacyPublicity: string;
  copyrightTrademark: string;
  impersonation: string;
  maliciousLink: string;
  inaccurateRights: string;
  other: string;
  whatHappened: string;
  followUpEmail: string;
  followUpPermission: string;
  submitReport: string;
  backToRelease: string;
}

export const copy: Record<SupportedLocale, ReleaseCopy> = {
  en: {
    releaseFallback: "Release", catalogueRelease: "Catalogue Release", updated: "Release data updated", publishing: "Publishing",
    releaseDestinations: "Release destinations", openInMyVinyl: "Open in MyVinyl", viewOnDiscogs: "View on Discogs",
    externalLink: "external link", getMyVinyl: "Get MyVinyl", tracklist: "Tracklist", releaseIdentifiers: "Release identifiers",
    genresAndStyles: "Genres and styles", reportThisPage: "Report This Page", privacy: "Privacy", terms: "Terms",
    homeLabel: "MyVinyl home", skipToDetails: "Skip to release details", retry: "Retry", myVinylHome: "MyVinyl home",
    notFoundHeading: "Release not found", notFoundDetail: "We couldn't find a release for this link.",
    goneHeading: "Release no longer available", goneDetail: "This release is no longer available.",
    unavailableHeading: "Release details temporarily unavailable", unavailableDetail: "We couldn't load this release right now. Please try again.",
    freshnessDetail: "We couldn't refresh this release within the required freshness window.",
    busyDetail: "The release data service is busy. Please try again shortly.", reportTitle: "Report Release",
    reportQueued: "Thank you. Your report has been queued for human review.", reportInvalid: "Check the required fields and try again.",
    reportReviewNotice: "Reports are reviewed by an authorized person and never suppress a page automatically.",
    reason: "Reason", chooseReason: "Choose a reason", privacyPublicity: "Privacy or publicity harm",
    copyrightTrademark: "Copyright or trademark claim", impersonation: "Impersonation", maliciousLink: "Malicious link",
    inaccurateRights: "Inaccurate rights claim", other: "Other", whatHappened: "What happened?",
    followUpEmail: "Email for follow-up, optional", followUpPermission: "MyVinyl may contact me about this report",
    submitReport: "Submit report", backToRelease: "Back to Release",
  },
  de: {
    releaseFallback: "Veröffentlichung", catalogueRelease: "Katalogveröffentlichung", updated: "Veröffentlichungsdaten aktualisiert", publishing: "Veröffentlichung",
    releaseDestinations: "Ziele zur Veröffentlichung", openInMyVinyl: "In MyVinyl öffnen", viewOnDiscogs: "Auf Discogs ansehen",
    externalLink: "externer Link", getMyVinyl: "MyVinyl laden", tracklist: "Trackliste", releaseIdentifiers: "Veröffentlichungskennungen",
    genresAndStyles: "Genres und Stile", reportThisPage: "Diese Seite melden", privacy: "Datenschutz", terms: "Nutzungsbedingungen",
    homeLabel: "MyVinyl-Startseite", skipToDetails: "Zu den Veröffentlichungsdetails springen", retry: "Erneut versuchen", myVinylHome: "MyVinyl-Startseite",
    notFoundHeading: "Veröffentlichung nicht gefunden", notFoundDetail: "Für diesen Link wurde keine Veröffentlichung gefunden.",
    goneHeading: "Veröffentlichung nicht mehr verfügbar", goneDetail: "Diese Veröffentlichung ist nicht mehr verfügbar.",
    unavailableHeading: "Veröffentlichungsdetails vorübergehend nicht verfügbar", unavailableDetail: "Diese Veröffentlichung konnte gerade nicht geladen werden. Bitte versuche es erneut.",
    freshnessDetail: "Diese Veröffentlichung konnte nicht innerhalb des erforderlichen Aktualitätszeitraums aktualisiert werden.",
    busyDetail: "Der Dienst für Veröffentlichungsdaten ist ausgelastet. Bitte versuche es gleich noch einmal.", reportTitle: "Veröffentlichung melden",
    reportQueued: "Vielen Dank. Deine Meldung wurde zur Prüfung durch eine Person eingereiht.", reportInvalid: "Prüfe die Pflichtfelder und versuche es erneut.",
    reportReviewNotice: "Meldungen werden von einer autorisierten Person geprüft und führen nie automatisch zur Sperrung einer Seite.",
    reason: "Grund", chooseReason: "Grund auswählen", privacyPublicity: "Verletzung von Datenschutz- oder Persönlichkeitsrechten",
    copyrightTrademark: "Urheberrechts- oder Markenanspruch", impersonation: "Identitätsmissbrauch", maliciousLink: "Schädlicher Link",
    inaccurateRights: "Unzutreffender Rechteanspruch", other: "Sonstiges", whatHappened: "Was ist passiert?",
    followUpEmail: "E-Mail für Rückfragen, optional", followUpPermission: "MyVinyl darf mich zu dieser Meldung kontaktieren",
    submitReport: "Meldung senden", backToRelease: "Zurück zur Veröffentlichung",
  },
  es: {
    releaseFallback: "Edición", catalogueRelease: "Edición del catálogo", updated: "Datos de la edición actualizados", publishing: "Publicación",
    releaseDestinations: "Destinos de la edición", openInMyVinyl: "Abrir en MyVinyl", viewOnDiscogs: "Ver en Discogs",
    externalLink: "enlace externo", getMyVinyl: "Obtener MyVinyl", tracklist: "Lista de canciones", releaseIdentifiers: "Identificadores de la edición",
    genresAndStyles: "Géneros y estilos", reportThisPage: "Denunciar esta página", privacy: "Privacidad", terms: "Términos",
    homeLabel: "Inicio de MyVinyl", skipToDetails: "Ir a los detalles de la edición", retry: "Reintentar", myVinylHome: "Inicio de MyVinyl",
    notFoundHeading: "Edición no encontrada", notFoundDetail: "No hemos encontrado ninguna edición para este enlace.",
    goneHeading: "Edición ya no disponible", goneDetail: "Esta edición ya no está disponible.",
    unavailableHeading: "Detalles de la edición no disponibles temporalmente", unavailableDetail: "No hemos podido cargar esta edición. Inténtalo de nuevo.",
    freshnessDetail: "No hemos podido actualizar esta edición dentro del periodo de vigencia requerido.",
    busyDetail: "El servicio de datos de ediciones está ocupado. Inténtalo de nuevo en unos instantes.", reportTitle: "Denunciar edición",
    reportQueued: "Gracias. Tu denuncia se ha puesto en cola para que la revise una persona.", reportInvalid: "Comprueba los campos obligatorios e inténtalo de nuevo.",
    reportReviewNotice: "Una persona autorizada revisa las denuncias. Una denuncia nunca oculta una página automáticamente.",
    reason: "Motivo", chooseReason: "Elige un motivo", privacyPublicity: "Daño a la privacidad o a la imagen pública",
    copyrightTrademark: "Reclamación de derechos de autor o marca", impersonation: "Suplantación de identidad", maliciousLink: "Enlace malicioso",
    inaccurateRights: "Reclamación de derechos incorrecta", other: "Otro", whatHappened: "¿Qué ha ocurrido?",
    followUpEmail: "Correo para seguimiento, opcional", followUpPermission: "MyVinyl puede ponerse en contacto conmigo sobre esta denuncia",
    submitReport: "Enviar denuncia", backToRelease: "Volver a la edición",
  },
  fr: {
    releaseFallback: "Édition", catalogueRelease: "Édition du catalogue", updated: "Données de l'édition mises à jour", publishing: "Publication",
    releaseDestinations: "Destinations de l'édition", openInMyVinyl: "Ouvrir dans MyVinyl", viewOnDiscogs: "Voir sur Discogs",
    externalLink: "lien externe", getMyVinyl: "Obtenir MyVinyl", tracklist: "Liste des pistes", releaseIdentifiers: "Identifiants de l'édition",
    genresAndStyles: "Genres et styles", reportThisPage: "Signaler cette page", privacy: "Confidentialité", terms: "Conditions",
    homeLabel: "Accueil MyVinyl", skipToDetails: "Accéder aux détails de l'édition", retry: "Réessayer", myVinylHome: "Accueil MyVinyl",
    notFoundHeading: "Édition introuvable", notFoundDetail: "Aucune édition ne correspond à ce lien.",
    goneHeading: "Édition indisponible", goneDetail: "Cette édition n'est plus disponible.",
    unavailableHeading: "Détails de l'édition temporairement indisponibles", unavailableDetail: "Impossible de charger cette édition pour le moment. Réessayez.",
    freshnessDetail: "Impossible d'actualiser cette édition dans le délai de fraîcheur requis.",
    busyDetail: "Le service de données des éditions est occupé. Réessayez dans quelques instants.", reportTitle: "Signaler l'édition",
    reportQueued: "Merci. Votre signalement est en attente d'un examen humain.", reportInvalid: "Vérifiez les champs obligatoires et réessayez.",
    reportReviewNotice: "Une personne autorisée examine les signalements. Un signalement ne masque jamais une page automatiquement.",
    reason: "Motif", chooseReason: "Choisissez un motif", privacyPublicity: "Atteinte à la vie privée ou au droit à l'image",
    copyrightTrademark: "Réclamation relative au droit d'auteur ou à une marque", impersonation: "Usurpation d'identité", maliciousLink: "Lien malveillant",
    inaccurateRights: "Réclamation de droits inexacte", other: "Autre", whatHappened: "Que s'est-il passé ?",
    followUpEmail: "E-mail pour le suivi, facultatif", followUpPermission: "MyVinyl peut me contacter au sujet de ce signalement",
    submitReport: "Envoyer le signalement", backToRelease: "Retour à l'édition",
  },
  it: {
    releaseFallback: "Pubblicazione", catalogueRelease: "Pubblicazione del catalogo", updated: "Dati della pubblicazione aggiornati", publishing: "Pubblicazione",
    releaseDestinations: "Destinazioni della pubblicazione", openInMyVinyl: "Apri in MyVinyl", viewOnDiscogs: "Visualizza su Discogs",
    externalLink: "link esterno", getMyVinyl: "Scarica MyVinyl", tracklist: "Tracklist", releaseIdentifiers: "Identificatori della pubblicazione",
    genresAndStyles: "Generi e stili", reportThisPage: "Segnala questa pagina", privacy: "Privacy", terms: "Termini",
    homeLabel: "Pagina iniziale di MyVinyl", skipToDetails: "Vai ai dettagli della pubblicazione", retry: "Riprova", myVinylHome: "Pagina iniziale di MyVinyl",
    notFoundHeading: "Pubblicazione non trovata", notFoundDetail: "Non abbiamo trovato una pubblicazione per questo link.",
    goneHeading: "Pubblicazione non più disponibile", goneDetail: "Questa pubblicazione non è più disponibile.",
    unavailableHeading: "Dettagli della pubblicazione temporaneamente non disponibili", unavailableDetail: "Non è stato possibile caricare questa pubblicazione. Riprova.",
    freshnessDetail: "Non è stato possibile aggiornare questa pubblicazione entro il periodo di validità richiesto.",
    busyDetail: "Il servizio dei dati delle pubblicazioni è occupato. Riprova tra poco.", reportTitle: "Segnala pubblicazione",
    reportQueued: "Grazie. La segnalazione è in coda per la revisione da parte di una persona.", reportInvalid: "Controlla i campi obbligatori e riprova.",
    reportReviewNotice: "Una persona autorizzata esamina le segnalazioni. Una segnalazione non nasconde mai una pagina automaticamente.",
    reason: "Motivo", chooseReason: "Scegli un motivo", privacyPublicity: "Danno alla privacy o al diritto di immagine",
    copyrightTrademark: "Rivendicazione di copyright o marchio", impersonation: "Furto d'identità", maliciousLink: "Link dannoso",
    inaccurateRights: "Rivendicazione di diritti inesatta", other: "Altro", whatHappened: "Che cosa è successo?",
    followUpEmail: "E-mail per il ricontatto, facoltativa", followUpPermission: "MyVinyl può contattarmi in merito a questa segnalazione",
    submitReport: "Invia segnalazione", backToRelease: "Torna alla pubblicazione",
  },
  ja: {
    releaseFallback: "リリース", catalogueRelease: "カタログリリース", updated: "リリースデータの更新日時", publishing: "出版情報",
    releaseDestinations: "リリースのリンク", openInMyVinyl: "MyVinylで開く", viewOnDiscogs: "Discogsで見る",
    externalLink: "外部リンク", getMyVinyl: "MyVinylを入手", tracklist: "トラックリスト", releaseIdentifiers: "リリース識別情報",
    genresAndStyles: "ジャンルとスタイル", reportThisPage: "このページを報告", privacy: "プライバシー", terms: "利用規約",
    homeLabel: "MyVinylホーム", skipToDetails: "リリースの詳細へ移動", retry: "再試行", myVinylHome: "MyVinylホーム",
    notFoundHeading: "リリースが見つかりません", notFoundDetail: "このリンクに該当するリリースが見つかりませんでした。",
    goneHeading: "リリースは利用できません", goneDetail: "このリリースは利用できなくなりました。",
    unavailableHeading: "リリースの詳細を一時的に利用できません", unavailableDetail: "現在このリリースを読み込めません。もう一度お試しください。",
    freshnessDetail: "必要な更新期限内にこのリリースを更新できませんでした。",
    busyDetail: "リリースデータサービスが混み合っています。しばらくしてからもう一度お試しください。", reportTitle: "リリースを報告",
    reportQueued: "ありがとうございます。報告は担当者による確認待ちです。", reportInvalid: "必須項目を確認して、もう一度お試しください。",
    reportReviewNotice: "報告は権限を持つ担当者が確認します。報告によってページが自動的に非表示になることはありません。",
    reason: "理由", chooseReason: "理由を選択", privacyPublicity: "プライバシーまたはパブリシティ権の侵害",
    copyrightTrademark: "著作権または商標権の申し立て", impersonation: "なりすまし", maliciousLink: "悪意のあるリンク",
    inaccurateRights: "不正確な権利の申し立て", other: "その他", whatHappened: "何が起きましたか？",
    followUpEmail: "連絡用メールアドレス（任意）", followUpPermission: "この報告についてMyVinylからの連絡を許可する",
    submitReport: "報告を送信", backToRelease: "リリースに戻る",
  },
  pt: {
    releaseFallback: "Edição", catalogueRelease: "Edição do catálogo", updated: "Dados da edição atualizados", publishing: "Publicação",
    releaseDestinations: "Destinos da edição", openInMyVinyl: "Abrir no MyVinyl", viewOnDiscogs: "Ver no Discogs",
    externalLink: "link externo", getMyVinyl: "Obter o MyVinyl", tracklist: "Lista de faixas", releaseIdentifiers: "Identificadores da edição",
    genresAndStyles: "Géneros e estilos", reportThisPage: "Denunciar esta página", privacy: "Privacidade", terms: "Termos",
    homeLabel: "Página inicial do MyVinyl", skipToDetails: "Ir para os detalhes da edição", retry: "Tentar novamente", myVinylHome: "Página inicial do MyVinyl",
    notFoundHeading: "Edição não encontrada", notFoundDetail: "Não encontrámos uma edição para esta ligação.",
    goneHeading: "Edição já não disponível", goneDetail: "Esta edição já não está disponível.",
    unavailableHeading: "Detalhes da edição temporariamente indisponíveis", unavailableDetail: "Não foi possível carregar esta edição. Tente novamente.",
    freshnessDetail: "Não foi possível atualizar esta edição dentro do período de validade exigido.",
    busyDetail: "O serviço de dados das edições está ocupado. Tente novamente dentro de instantes.", reportTitle: "Denunciar edição",
    reportQueued: "Obrigado. A sua denúncia está em fila para revisão por uma pessoa.", reportInvalid: "Verifique os campos obrigatórios e tente novamente.",
    reportReviewNotice: "Uma pessoa autorizada analisa as denúncias. Uma denúncia nunca oculta uma página automaticamente.",
    reason: "Motivo", chooseReason: "Escolha um motivo", privacyPublicity: "Danos à privacidade ou ao direito de imagem",
    copyrightTrademark: "Reclamação de direitos de autor ou marca", impersonation: "Falsificação de identidade", maliciousLink: "Ligação maliciosa",
    inaccurateRights: "Reclamação de direitos incorreta", other: "Outro", whatHappened: "O que aconteceu?",
    followUpEmail: "E-mail para acompanhamento, opcional", followUpPermission: "O MyVinyl pode contactar-me sobre esta denúncia",
    submitReport: "Enviar denúncia", backToRelease: "Voltar à edição",
  },
  "zh-CN": {
    releaseFallback: "发行版", catalogueRelease: "目录发行版", updated: "发行数据更新时间", publishing: "发行信息",
    releaseDestinations: "发行版链接", openInMyVinyl: "在 MyVinyl 中打开", viewOnDiscogs: "在 Discogs 上查看",
    externalLink: "外部链接", getMyVinyl: "获取 MyVinyl", tracklist: "曲目列表", releaseIdentifiers: "发行版标识",
    genresAndStyles: "流派和风格", reportThisPage: "举报此页面", privacy: "隐私", terms: "条款",
    homeLabel: "MyVinyl 首页", skipToDetails: "跳转到发行版详情", retry: "重试", myVinylHome: "MyVinyl 首页",
    notFoundHeading: "未找到发行版", notFoundDetail: "没有找到此链接对应的发行版。",
    goneHeading: "发行版已不可用", goneDetail: "此发行版已不可用。",
    unavailableHeading: "发行版详情暂时不可用", unavailableDetail: "目前无法加载此发行版。请重试。",
    freshnessDetail: "无法在规定的有效期限内刷新此发行版。",
    busyDetail: "发行数据服务正忙。请稍后重试。", reportTitle: "举报发行版",
    reportQueued: "谢谢。您的举报已排队等待人工审核。", reportInvalid: "请检查必填字段并重试。",
    reportReviewNotice: "举报由授权人员审核，绝不会自动隐藏页面。",
    reason: "原因", chooseReason: "选择原因", privacyPublicity: "隐私权或公开权损害",
    copyrightTrademark: "版权或商标申诉", impersonation: "冒充他人", maliciousLink: "恶意链接",
    inaccurateRights: "不准确的权利申诉", other: "其他", whatHappened: "发生了什么？",
    followUpEmail: "后续联系邮箱（可选）", followUpPermission: "MyVinyl 可以就此举报联系我",
    submitReport: "提交举报", backToRelease: "返回发行版",
  },
};
