export function getUploadButtonLabel(uploading: boolean, hasImage: boolean) {
  if (uploading) {
    return 'Enviando...';
  }
  return hasImage ? 'Substituir' : 'Enviar Imagem';
}

export async function uploadBentoImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload/bento-image', {
    method: 'POST',
    body: formData,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Falha no envio');
  }
  return data.url;
}
