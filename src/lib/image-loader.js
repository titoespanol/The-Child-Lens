// This loader will just return the original src, effectively disabling Next.js image optimization
// for all images, which is needed to solve the 403 Forbidden error when deploying on Firebase App Hosting.
export default function customLoader({ src }) {
  return src;
}
