import { z } from "zod";

export const CreateHotelDTO = z.object({
    name: z.string(),
    location: z.string(),
    image: z.string(),
    price: z.number(),
    description: z.string(),
    amenities: z.array(z.string()).optional(),
});
