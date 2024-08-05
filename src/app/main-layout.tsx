import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/utils/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";

export async function LectureShowWindow() {
  const supabase = createClient();
  const lectures = await prisma.$transaction(async (prisma) => {
    return await prisma.lecture_info.findMany({ take: 10 });
  });

  return (
    <Carousel>
      <CarouselContent>
        {lectures.map((lecture) => {
          const { data } = supabase.storage
            .from("lecture-info")
            .getPublicUrl(lecture.thumbnail_image ?? "");
          const thumbnailUrl = data?.publicUrl;
          return (
            <CarouselItem key={lecture.id} className="basis-1/4">
              {/* shadcn 카드를 활용하여 이미지 카드 컴포넌트 만들기 */}
              <Link href={`/lecture/create?id=${lecture.id}`}>
                <Card>
                  <CardHeader>
                    <div className="h-[200px] relative">
                      <AspectRatio ratio={16 / 9}>
                        <Image
                          src={thumbnailUrl}
                          alt="thumbnail"
                          className="object-contain"
                          fill
                        />
                      </AspectRatio>
                    </div>
                    <CardTitle>{lecture.title}</CardTitle>
                    <CardDescription>{lecture.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>수강하러 가기</p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
