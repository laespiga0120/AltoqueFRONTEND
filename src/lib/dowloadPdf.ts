// Este archivo ayuda a reutilizar la lógica de descarga de PDFs

export async function downloadPdf(url: string, filename: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Error en la respuesta del servidor al descargar el PDF."
      );
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Fallo la descarga del PDF:", error);
    throw error;
  }
}
