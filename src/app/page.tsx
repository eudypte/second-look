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
    <>
      <header className="site-bar">
        <div className="brand" aria-label="Second Look">
          <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
            <polygon points="24,3 45,24 24,45 3,24" fill="#ffcd00" />
            <text
              x="24"
              y="32.5"
              textAnchor="middle"
              fontSize="22"
              fontWeight="900"
              fill="#1c2226"
            >
              2
            </text>
          </svg>
          <span>Second Look</span>
        </div>
      </header>

      <main className="page-shell">
        <MessageChecker
          initialVerdict={initialVerdict}
          intro={
            <section className="intro" aria-labelledby="page-title">
              <p className="eyebrow">A calmer way to check a worrying text</p>
              <h1 id="page-title">Not sure about a message?</h1>
              <p>
                Paste it here. We&apos;ll take a second look and explain
                anything that seems worrying.
              </p>
            </section>
          }
        />

        <aside className="home-screen-hint" aria-label="Add to Home Screen hint">
          <span aria-hidden="true">＋</span>
          <p>
            Want it handy? Open your browser menu and choose
            <strong> Add to Home Screen</strong>.
          </p>
        </aside>
      </main>
    </>
  );
}
