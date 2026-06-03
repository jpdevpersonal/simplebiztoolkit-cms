/** @type {import('postcss').Config} */
const config = {
  plugins: [
    "postcss-flexbugs-fixes",
    [
      "postcss-preset-env",
      {
        autoprefixer: {
          flexbox: "no-2009",
        },
        stage: 3,
        features: {
          "custom-properties": false,
        },
      },
    ],
    ...(process.env.NODE_ENV === "production"
      ? [
          [
            "@fullhuman/postcss-purgecss",
            {
              content: [
                "./src/pages/**/*.{js,jsx,ts,tsx}",
                "./src/components/**/*.{js,jsx,ts,tsx}",
                "./src/app/**/*.{js,jsx,ts,tsx}",
                "./src/editor/**/*.{js,jsx,ts,tsx}",
              ],
              defaultExtractor: (content) =>
                content.match(/[\w-/:]+(?<!:)/g) || [],
              safelist: {
                standard: ["html", "body", "svg"],
                deep: [
                  /^tiptap/,
                  /^ProseMirror/,
                  /^is-/,
                  /^has-/,
                  /^offcanvas/,
                  /^accordion/,
                  /^modal/,
                  /^fade/,
                  /^show/,
                  /^collaps/,
                  /^dropdown/,
                  /^nav/,
                  /^navbar/,
                  /^btn/,
                  /^sb-/,
                  /^hero-/,
                ],
              },
            },
          ],
        ]
      : []),
  ],
};

export default config;
