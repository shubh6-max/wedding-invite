// URL of one of Sage Envelope's illustrations: the original invitation artwork, used with the designer's permission,
// converted to WebP in public/sageenvelope/<name>.webp. Sources, sizes and permission: docs/original-assets-audit.md.
// tests/sageenvelope.test.js checks every name the design uses has its file.
export const art = (name) => `${import.meta.env.BASE_URL}sageenvelope/${name}.webp`
