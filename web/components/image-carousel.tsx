import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FallbackImage } from "@/components/ui/fallback-image";

export function ImageCarousel({ images }: { images: string[] }) {
  const carouselImages = images?.length ? images : ["/placeholder-product.svg"];

  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full"
    >
      <CarouselContent className="-mt-1 object-cover h-[300px] lg:h-[350px]">
        {carouselImages.map((image, index) => (
          <CarouselItem
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            className="flex justify-center items-center h-full w-full rounded-md"
          >
            <FallbackImage
              src={image}
              fallbackSrc="/placeholder-product.svg"
              alt="Product image"
              height={600}
              width={600}
              quality={100}
              priority
              className="w-full h-full object-contain rounded-md"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
