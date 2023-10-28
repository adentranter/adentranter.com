/** @type {import('next').NextConfig} */
const withImages = require('next-images');

module.exports = withImages({
  images: {
    domains: ['res.cloudinary.com'], // Add the domain(s) you need to allow
  },
});