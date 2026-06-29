import ky from "ky";

const api = ky.create({
    prefix: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
});

export default api;
