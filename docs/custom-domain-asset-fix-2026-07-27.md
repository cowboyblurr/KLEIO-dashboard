# KLEIO custom-domain asset-path repair

The GitHub Pages production build now targets `https://www.kleioarthouse.com` at the domain root.

The prior build emitted CSS and JavaScript URLs under `/KLEIO-dashboard`, which is correct for a GitHub project URL but incorrect after attaching a custom domain. The deployment workflow now rejects project-path assets, verifies local export files, and checks live CSS and JavaScript responses after deployment.
