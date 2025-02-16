import { loadScript } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

const markerOnClick = (infoWindow, location, map, marker) => {
  const infoWindowDiv = document.querySelector('.info-window');
  const ifVisible = infoWindowDiv?.classList?.contains('visible');

  if (ifVisible) {
    infoWindow.close();
    const accordionItem = document.querySelector('.accordion-item');
    accordionItem.classList.remove('open');
    accordionItem.removeAttribute('open');
  } else {
    infoWindow.setContent(
      // add dynamice class to the info window
      `<div class='info-window visible'>
        <div>
          <img class='info-window-logo' src='/assets/images/fspslogo.png'>
        </div>
        <div>
          <strong>${location.name}</strong><br>
          <small>${location.address}</small><br>
          <a href='https://www.google.com/maps/dir/?api=1&destination=${location.address}' target='_blank'>
            Get Directions
          </a>
        </div>
      </div>`,
    );
    infoWindow.open(map, marker);

    // open accordion item also
    const accordionItem = document.querySelector('.accordion-item');
    accordionItem.classList.add('open');
    accordionItem.setAttribute('open', 'true');
  }
};

/* eslint-disable  no-undef */
const mapProcessing = (locations) => {
  const mapContainer = div({ class: 'google-map' });

  window.initMap = () => {
    const map = new google.maps.Map(document.getElementsByClassName('google-map')[0], {
      center: { lat: locations[0].lat, lng: locations[0].lng }, // Default center
      zoom: 18,
    });

    const infoWindow = new google.maps.InfoWindow();
    google.maps.event.addListener(infoWindow, 'closeclick', () => {
      const accordionItem = document.querySelector('.accordion-item');
      accordionItem.classList.remove('open');
      accordionItem.removeAttribute('open');
    });

    const markers = [];

    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.name,
        gmpClickable: true,
        icon: {
          url: 'https://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png', // Example pushpin icon
          scaledSize: new google.maps.Size(32, 32), // Resize if needed
        },
      });

      if (index === 0) {
        markerOnClick(infoWindow, location, map, marker);
      }

      marker.addListener('click', () => {
        markerOnClick(infoWindow, location, map, marker);
      });

      markers.push(marker);
    });

    document.querySelectorAll('.accordion-item')?.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        map.setCenter(markers[index].getPosition());
        google.maps.event.trigger(markers[index], 'click');
      });
    });

    // Click event handler for items
    document.querySelectorAll('.location-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        map.setCenter(markers[index].getPosition());
        google.maps.event.trigger(markers[index], 'click');
      });
    });
  };

  loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyAwRAI9ybH41VklsZdSJgye2sDAPj1-myI&callback=initMap', {
    async: true,
    defer: true,
  });

  return mapContainer;
};

export default function decorate(block) {
  const tempDiv = div({ class: 'locations' });
  const locations = [];

  [...block.children].forEach((row) => {
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);
    const body = row.children[1];
    body.className = 'accordion-item-body';
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);

    const location = {
      name: summary.textContent,
    };

    body.querySelectorAll('p').forEach((x, index) => {
      if (index === 0) {
        x.classList.add('location');
        location.address = x.textContent;
      } else if (index === 1) {
        x.classList.add('phone');
        location.phone = x.textContent;
      } else if (index === 2) {
        x.classList.add('email');
        location.email = x.textContent;
      } else {
        x.classList.add('lat-lng');
        location.lat = Number(x.textContent.split(',')[0]);
        location.lng = Number(x.textContent.split(',')[1]);
      }
    });

    locations.push(location);
    row.replaceWith(details);
    tempDiv.append(details);
  });

  const mapContainer = mapProcessing(locations);
  block.replaceChildren(tempDiv, div({ class: 'map' }, mapContainer));
}
