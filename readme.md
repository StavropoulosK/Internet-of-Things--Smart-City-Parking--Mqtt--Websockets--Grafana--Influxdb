# Smart City Parking

## Google Maps API Keys

### API Key

Αρχικά χρειάζεται ένα API key που βγαίνει από την google.

### Map Id

Το mapId βγαίνει και αυτό από τη google και περιορίζεται μόνο σε ένα API για αυτό χρειάζεται να
συμπληρωθεί και αυτό. Το Map Id βγαίνει στην καρτέλα Map Management και μπορεί να μπει 
ένα Style στο Map Styles.

![Map Id](./Presentations/images/map-id.png)

### Navigation

Η εφαρμογή κατά την πλοήγηση εντοπίζει την τωρινή τοποθεσία και εμφανίζει την διαδρομή. Για να γίνει αυτό χρησιμοποιείται το navigator.geolocation api του browser. Αυτό ελέγχει αυτόματα την θέση με βάση το gps αν είναι διαθέσιμο ή τη διεύθυνση ip με λιγότερη ακρίβεια αν δεν είναι διαθέσιμο.

Για να τρέξει η προσομοίωση πρέπει να τρέχουν ταυτόχρονα τα  προγράμματα Iot_Agent.py, simulate.py, influx Agent και ο server.
