export function resizeImage(file, options = {}) {
  const {
    maxSide = 640,
    quality = 0.62,
    maxLength = 220000,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Nao foi possivel ler a imagem.'));
        return;
      }

      const image = new window.Image();

      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Nao foi possivel processar a imagem.'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressedImage = canvas.toDataURL('image/jpeg', quality);

        if (compressedImage.length > maxLength) {
          reject(new Error('A imagem ficou muito grande. Escolha outra foto menor.'));
          return;
        }

        resolve(compressedImage);
      };

      image.onerror = () => reject(new Error('Nao foi possivel abrir a imagem selecionada.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Nao foi possivel carregar a imagem selecionada.'));
    reader.readAsDataURL(file);
  });
}
