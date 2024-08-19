const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  fetch('/oidp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  })
    .then(response => response.json())
    .then(draft => {
      // We might wanna check if window.opener is defined, if not, redirect back to the forms?
      window.opener.postMessage({ draft })
      window.close()
    })
} else {
  console.log('No token found in URL parameters');
}
