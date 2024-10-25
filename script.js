const API_KEY = 'AIzaSyApOnzg2iKE3RSrsH5hkhNDRRxnDmGUxuU';
const YOUTUBE_SEARCH_API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=24&regionCode=FR&order=date&maxResults=5&key=${API_KEY}`;

let video1Views, video2Views, video1Url, video2Url;
let countdownInterval;

function getRandomSearchTerm() {
  const terms = ['divertissement', 'film', 'musique', 'jeu', 'émission', 'comédie', 'show'];
  return terms[Math.floor(Math.random() * terms.length)];
}

function isLandscape(thumbnail) {
  const ratio = thumbnail.width / thumbnail.height;
  return ratio >= 1.5 && ratio <= 2; // Garde les vidéos dont le ratio est proche de 16:9 (exclut les Shorts)
}

function loadVideos() {
  clearInterval(countdownInterval); // Réinitialiser le chronomètre si un choix précédent a été fait
  document.getElementById('countdown').textContent = ''; // Réinitialiser l'affichage du chronomètre

  // Cacher les infos de la vidéo entre les chargements
  document.getElementById('video1-info').innerHTML = '';
  document.getElementById('video2-info').innerHTML = '';

  const searchTerm = getRandomSearchTerm(); // Obtenir un mot-clé aléatoire

  fetch(`${YOUTUBE_SEARCH_API_URL}&q=${searchTerm}`)
    .then(response => response.json())
    .then(data => {
      const landscapeVideos = data.items.filter(video => {
        const thumbnail = video.snippet.thumbnails.medium;
        return isLandscape(thumbnail); // Garde uniquement les vidéos en format paysage
      });

      if (landscapeVideos.length < 2) {
        alert('Pas assez de vidéos adaptées trouvées.');
        return;
      }

      // Choisir deux vidéos aléatoirement
      const video1 = landscapeVideos[0];
      const video2 = landscapeVideos[1];

      // Afficher les miniatures des vidéos
      document.getElementById('thumbnail1').src = video1.snippet.thumbnails.medium.url;
      document.getElementById('thumbnail2').src = video2.snippet.thumbnails.medium.url;

      // Stocker les URLs des vidéos pour afficher le lien plus tard
      video1Url = `https://www.youtube.com/watch?v=${video1.id.videoId}`;
      video2Url = `https://www.youtube.com/watch?v=${video2.id.videoId}`;

      // Récupérer le nombre de vues pour chaque vidéo
      fetchVideoStats(video1.id.videoId, video2.id.videoId);
    })
    .catch(error => console.error('Erreur:', error));
}

function fetchVideoStats(video1Id, video2Id) {
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${video1Id},${video2Id}&key=${API_KEY}`;
  fetch(statsUrl)
    .then(response => response.json())
    .then(data => {
      const video1 = data.items[0];
      const video2 = data.items[1];

      video1Views = parseInt(video1.statistics.viewCount, 10);
      video2Views = parseInt(video2.statistics.viewCount, 10);
    })
    .catch(error => console.error('Erreur lors de la récupération des stats:', error));
}

function startCountdown(seconds, callback) {
  let timeRemaining = seconds;
  const countdownElement = document.getElementById('countdown');
  countdownElement.textContent = `Changement dans ${timeRemaining}...`;

  countdownInterval = setInterval(() => {
    timeRemaining--;
    countdownElement.textContent = `Changement dans ${timeRemaining}...`;

    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);
      countdownElement.textContent = ''; // Effacer le texte du chronomètre
      callback(); // Appeler la fonction de rappel (rechargement des vidéos)
    }
  }, 1000);
}

function createExpandingCircle(videoElement, correct) {
  // Créer un div pour représenter le cercle
  const circle = document.createElement('div');
  circle.classList.add('expanding-circle');
  circle.style.backgroundColor = correct ? 'green' : 'red';

  // Obtenir les dimensions et la position de la vidéo
  const rect = videoElement.getBoundingClientRect();

  // Positionner le cercle au centre de la vidéo sélectionnée
  const circleDiameter = 0; // Taille initiale du cercle
  circle.style.left = `${rect.left + (rect.width / 2) - (circleDiameter / 2)}px`;
  circle.style.top = `${rect.top + (rect.height / 2) - (circleDiameter / 2)}px`;

  document.body.appendChild(circle);

  // Assurer que le cercle reste en arrière-plan
  circle.classList.add('persistent-background');

  // Supprimer l'animation après l'agrandissement mais laisser le fond coloré
  setTimeout(() => {
    circle.style.animation = 'none'; // Arrêter l'animation
    document.body.style.backgroundColor = correct ? 'green' : 'red'; // Appliquer la couleur au body
    document.body.removeChild(circle); // Retirer le div du cercle mais conserver la couleur
  }, 1000); // La durée de l'animation est d'1 seconde
}

function resetBackground() {
  document.body.style.backgroundColor = ''; // Réinitialiser le fond du body à sa couleur initiale
}

function chooseVideo(choice) {
  let correct = false;
  const selectedVideoElement = document.getElementById(`video${choice}`);

  if (choice === 1 && video1Views > video2Views) {
    correct = true;
  } else if (choice === 2 && video2Views > video1Views) {
    correct = true;
  }

  // Créer l'animation du cercle
  createExpandingCircle(selectedVideoElement, correct);

  // Afficher le nombre de vues et le lien pour chaque vidéo
  document.getElementById('video1-info').innerHTML = `Nombre de vues : ${video1Views} <br><a href="${video1Url}" target="_blank">Voir la vidéo</a>`;
  document.getElementById('video2-info').innerHTML = `Nombre de vues : ${video2Views} <br><a href="${video2Url}" target="_blank">Voir la vidéo</a>`;

  // Lancer un chronomètre de 5 secondes avant de recharger les vidéos
  startCountdown(5, () => {
    resetBackground(); // Réinitialiser le fond après le chronomètre
    loadVideos(); // Recharger de nouvelles vidéos après le chronomètre
  });
}
