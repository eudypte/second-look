import { MessageChecker } from "./components/message-checker";
import { getDevelopmentFixture } from "./fixtures";

interface HomeProps {
  searchParams: Promise<{ fixture?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { fixture } = await searchParams;
  const fixtureName = Array.isArray(fixture) ? fixture[0] : fixture;
  const initialVerdict =
    process.env.NODE_ENV === "development"
      ? getDevelopmentFixture(fixtureName)
      : undefined;

  return (
    <main className="page-shell">
      <div className="brand" aria-label="Second Look">
        <span className="brand-mark" aria-hidden="true">
          2
        </span>
        <span>Second Look</span>
      </div>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">A calmer way to check a worrying text</p>
        <h1 id="page-title">Not sure about a message?</h1>
        <p>
          Paste it here. We&apos;ll take a second look and explain anything that
          seems worrying.
        </p>
      </section>

      <MessageChecker initialVerdict={initialVerdict} />

      <aside className="home-screen-hint" aria-label="Add to Home Screen hint">
        <span aria-hidden="true">＋</span>
        <p>
          Want it handy? Open your browser menu and choose
          <strong> Add to Home Screen</strong>.
        </p>
      </aside>
    </main>
  );
}
