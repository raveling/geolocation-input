# Geolocation input
Custom extension of the Sanity geopoint component that implements reverse geocoding


### someDocument.js
```
fields: [
  {
    title: 'Location',
    name: 'location',
    type: 'geolocation'
  }
]
```

### Output
```
location: {
  _type: "geolocation",

  geoaddress:{
    address: "Kirsten Flagstads Plass 1"
    city: "Oslo"
    country: "Norway"
  },

  geopoint:{
    _type: "geopoint",
    lat: 59.90748850000002,
    lng: 10.753127500000005
  }
}
```
