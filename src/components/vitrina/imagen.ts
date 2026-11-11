import { getImgProps, type ImageProps } from "next/dist/shared/lib/get-img-props";
import type { ImageConfigComplete } from "next/dist/shared/lib/image-config";
import cargador from "next/dist/shared/lib/image-loader";

/**
 * Las props del <img> que pondría next/image (srcset de /_next/image, sizes,
 * lazy), calculadas en el servidor. Es el getImageProps de next/image sin
 * importar next/image: su entrada trae también el componente de cliente
 * <Image>, y todo módulo de cliente que importa un componente del servidor
 * viaja al navegador aunque nadie lo pinte (unos 7 KB gz en la portada).
 * Si Next mueve estos archivos, el build falla aquí y no en silencio.
 */
export function propsDeImagen(props: ImageProps) {
  const { props: img } = getImgProps(props, {
    defaultLoader: cargador,
    // El build de Next reemplaza esta variable por la config `images` de next.config, igual que en next/image.
    imgConf: process.env.__NEXT_IMAGE_OPTS as unknown as ImageConfigComplete,
  });
  // Como getImageProps: fuera lo que quedó sin valor, para no escribir atributos vacíos.
  for (const [k, v] of Object.entries(img)) if (v === undefined) delete img[k as keyof typeof img];
  return img;
}
