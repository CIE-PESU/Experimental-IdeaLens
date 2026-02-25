import IdeaPageClient from "./IdeaPageClient";

export function generateStaticParams() {
    return [{ id: "view" }];
}

export default function Page() {
    return <IdeaPageClient />;
}
