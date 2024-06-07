<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="info">
      <b-navbar-brand href="/">
        <img src="../assets/chu_logo_original.png" width="50" height="50" alt />
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item href="/booking" active>Réserver un matelas</b-nav-item>
          <b-nav-item href="/management">Gestion de matelas</b-nav-item>
          <b-nav-item href="/history" >Historique</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <!-- Reservation modal -->

    <b-modal id="reservation" title="Réserver" @show="onShowModal" @hidden="onHiddenModal">
      <template v-slot:modal-footer="{ ok, cancel }">
        <!-- Emulate built in modal footer ok and cancel button actions -->
        <b-button size="sm" variant="danger" @click="cancel()">Cancel</b-button>
        <b-button
                size="sm"
                variant="success"
                :disabled="!(correctNIP && validScannerDate && mepAfterScanner && ftrAfterMep)"
                @click="reservationSubmit"
        >OK</b-button>
      </template>
      <div class="modal-body">
        <div class="form-group">
          <b-form @reset="reservationReset">
            <b-form-group
                    id="reservation-form"
                    label="NIP :"
                    label-for="reservation-form-1"
                    description="Entrez le NIP du patient pour ce matelas."
            >
              <b-form-input
                      id="reservation-form-1"
                      v-model="reservationForm.nip"
                      type="number"
                      :state="correctNIP"
                      required
                      placeholder="Saisissez un NIP"
              ></b-form-input>
              <b-form-invalid-feedback
                      id="reservation-form-1-feedback"
              >Le NIP saisi est manquant ou invalide !</b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
                    id="reservation-form-2"
                    label="Date scanner :"
                    label-for="reservation-form-2"
            >
              <b-form-input
                      id="reservation-form-2"
                      v-model="reservationForm.scanner_date"
                      type="date"
                      :min="this.booking_start_date"
                      :max="this.booking_end_date"
                      :state="validScannerDate"
                      required
                      placeholder="Entrez une date pour le scanner"
              ></b-form-input>
              <b-form-invalid-feedback
                      id="reservation-form-2-feedback"
              >La date du scanner doit être autorisée par le calendrier.</b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="reservation-form-3" label="Date MEP :" label-for="reservation-form-3">
              <b-form-input
                      id="reservation-form-3"
                      v-model="reservationForm.mep_date"
                      type="date"
                      :min="this.booking_start_date"
                      :max="this.booking_end_date"
                      :state="mepAfterScanner"
                      required
                      placeholder="Entrez une date MEP"
              ></b-form-input>
              <b-form-invalid-feedback
                      id="reservation-form-3-feedback"
              >La date MEP ne peut pas être avant celle du scanner et doit être autorisée par le calendrier.</b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
                    id="reservation-form-4"
                    label="Nombre de séances :"
                    label-for="reservation-form-4"
            >
              <b-form-input
                      id="reservation-form-4"
                      v-model="reservationForm.session_nb"
                      type="text"
                      required
                      placeholder="Saisissez les informations sur les séances"
              ></b-form-input>
            </b-form-group>

            <b-form-group id="reservation-form-5" label="Date FTR :" label-for="reservation-form-5">
              <b-form-input
                      id="reservation-form-5"
                      v-model="reservationForm.ftr_date"
                      type="date"
                      :min="this.booking_start_date"
                      :max="this.booking_end_date"
                      :state="ftrAfterMep"
                      required
                      placeholder="Enter une date FTR"
              ></b-form-input>
              <b-form-invalid-feedback
                      id="reservation-form-5-feedback"
              >La date FTR ne peut pas se situer avant la date MEP et doit être autorisée par le calendrier.</b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="reservation-form-6" label="Remarque :" label-for="reservation-form-6">
              <b-form-input id="reservation-form-6" v-model="reservationForm.remark" type="text"></b-form-input>
            </b-form-group>

            <b-button type="reset" variant="danger">Reset</b-button>
          </b-form>
        </div>
      </div>
    </b-modal>

    <!-- Automatic reservation modal -->

    <b-modal id="auto-reservation" title="Réservation automatique" @show="onShowAutoModal" @hidden="onHiddenAutoModal">
      <template v-slot:modal-footer="{ ok, cancel }">
        <!-- Emulate built in modal footer ok and cancel button actions -->
        <b-button size="sm" variant="danger" @click="cancel()">
          Cancel
        </b-button>
        <b-button size="sm" variant="success" :disabled='!(correctNIP && validScannerDate && mepAfterScanner && ftrAfterMep)' @click="autoReservationSubmit">
          OK
        </b-button>
      </template>
      <div class="modal-body">
        <div class="form-group">
          <b-form @reset="reservationReset">
            <b-form-group
                    id="auto-reservation-form"
                    label="NIP :"
                    label-for="auto-reservation-form-1"
                    description="Entrez le NIP du patient pour ce matelas."
            >
              <b-form-input
                      id="auto-reservation-form-1"
                      v-model="reservationForm.nip"
                      type="number"
                      :state="correctNIP"
                      required
                      placeholder="Saisissez un NIP"
              ></b-form-input>
              <b-form-invalid-feedback id="auto-reservation-form-1-feedback">
                Le NIP saisi est manquant ou invalide !
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="auto-reservation-form-2" label="Date scanner :" label-for="auto-reservation-form-2">
              <b-form-input
                      id="auto-reservation-form-2"
                      v-model="reservationForm.scanner_date"
                      type="date"
                      :min="this.booking_start_date"
                      :max="this.booking_end_date"
                      :state="validScannerDate"
                      required
                      placeholder="Entrez une date pour le scanner"
              ></b-form-input>
              <b-form-invalid-feedback id="auto-reservation-form-2-feedback">
                La date du scanner doit être autorisée par le calendrier.
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="auto-reservation-form-3" label="Date MEP :" label-for="auto-reservation-form-3">
              <b-form-input
                      id="auto-reservation-form-3"
                      v-model="reservationForm.mep_date"
                      type="date"
                      :min="this.booking_start_date"
                      :max="this.booking_end_date"
                      :state="mepAfterScanner"
                      required
                      placeholder="Entrez une date MEP"
              ></b-form-input>
              <b-form-invalid-feedback id="auto-reservation-form-3-feedback">
                La date MEP ne peut pas être avant celle du scanner et doit être autorisée par le calendrier.
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="auto-reservation-form-4" label="Nombre de séances :" label-for="auto-reservation-form-4">
              <b-form-input
                      id="auto-reservation-form-4"
                      v-model="reservationForm.session_nb"
                      type="text"
                      required
                      placeholder="Saisissez les informations sur les séances"
              ></b-form-input>
            </b-form-group>

            <b-form-group id="auto-reservation-form-5" label="Date FTR :" label-for="auto-reservation-form-5">
              <b-form-input
                      id="auto-reservation-form-5"
                      v-model="reservationForm.ftr_date"
                      type="date"
                      :min="this.booking_start_date"
                      :max="this.booking_end_date"
                      :state="ftrAfterMep"
                      required
                      placeholder="Enter une date FTR"
              ></b-form-input>
              <b-form-invalid-feedback id="auto-reservation-form-5-feedback">
                La date FTR ne peut pas se situer avant la date MEP et doit être autorisée par le calendrier.
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="auto-reservation-form-6" label="Remarque :" label-for="auto-reservation-form-6">
              <b-form-input
                      id="auto-reservation-form-6"
                      v-model="reservationForm.remark"
                      type="text"
              ></b-form-input>
            </b-form-group>

            <b-button type="reset" variant="danger">Reset</b-button>
          </b-form>
        </div>
      </div>
    </b-modal>

    <div id="tablediv">
      <div class="mt-2"></div>

      <!-- Search bar -->

      <h1>Rechercher un matelas pour une période</h1>
      <div class="w-75 m-3">
        <b-button-toolbar aria-label="Search toolbar">
          <b-input-group prepend="Qui commence le : ">

            <b-form-input
                    id="input-search-start-date"
                    v-model="search_start_date"
                    type="date"
                    :min="this.today"
                    :max="this.maxDate"
            ></b-form-input>

            <div class="mx-4"></div>
            <b-input-group-prepend is-text>Et se termine le : </b-input-group-prepend>

            <b-form-input
                    id="input-search-end-date"
                    v-model="search_end_date"
                    type="date"
                    :min="this.today"
                    :max="this.maxDate"
            ></b-form-input>

            <b-input-group-append>
              <b-button
                      id="search-button"
                      type="submit"
                      :disabled='!validSearchPeriod'
                      @click="search_mattresses"
                      variant="primary">
                Rechercher
              </b-button>
            </b-input-group-append>

          </b-input-group>

          <b-button
                  id="auto-booking-button"
                  class="mx-auto"
                  v-b-modal.auto-reservation
                  variant="success">
            Réservation automatique
          </b-button>

        </b-button-toolbar>
      </div>

      <div v-if="errorInSearch" class="m-3">
        <div class="red-text">
          <span> ⚠️ La date du début de la période doit être inférieure à la date de fin de la période. </span>
        </div>
      </div>

      <b-table :items="items" :fields="fields" striped  :sort-by="sortBy" show-empty hover responsive>

        <template v-slot:cell(etat)="etat">
          <b-badge v-if="etat.value === 'Bon'" variant="success">Bon</b-badge>
          <b-badge v-else-if="etat.value === 'HS'" variant="warning">HS</b-badge>
          <b-badge v-else variant="danger">Urgences uniquement</b-badge>
        </template>

        <template v-slot:cell(occupation)="occupation">
          <b-badge v-if="equalsNullDate(occupation.value)" variant="info">Libre</b-badge>
          <span v-else>{{displayFormatted(occupation.value)}}</span>
        </template>

        <template v-slot:cell(Action)="row">
          <b-button size="sm" @click="row.toggleDetails" class="mx-1" variant="info">Détails</b-button>
          <b-button
                  size="sm"
                  class="mx-1"
                  @click="send_to_modal(row.item.id)"
                  variant="success"
          >Réserver</b-button>
        </template>

        <template v-slot:row-details="row">
          <b-card>
            <b-table :items="row.item.data" :fields="fields_data">
              <template v-slot:cell(date_scanner)="date">{{displayFormatted(date.value)}}</template>

              <template v-slot:cell(date_mep)="date">{{displayFormatted(date.value)}}</template>

              <template v-slot:cell(date_ftr)="date">{{displayFormatted(date.value)}}</template>
            </b-table>
          </b-card>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  import moment from 'moment';


  export default {
    name: 'app',

    computed: {
      errorInSearch(){
        if(this.isUndefined(this.search_start_date) || this.isUndefined(this.search_end_date)){
          return false;
        }
        return this.search_start_date >= this.search_end_date;
      },

      validSearchPeriod(){
        if(this.isUndefined(this.search_start_date) || this.isUndefined(this.search_end_date)){
          return null;
        }
        return this.search_start_date < this.search_end_date;
      },

      correctNIP(){
        if(this.reservationForm.nip.length === 0){
          return null;
        }
        return !isNaN(this.reservationForm.nip) && this.reservationForm.nip > 0 && (this.reservationForm.nip % 1 === 0);
      },

      validScannerDate() {
        if (this.isUndefined(this.reservationForm.scanner_date)) {
          return null;
        }
        return this.isInSearchRange(this.reservationForm.scanner_date);
      },

      mepAfterScanner() {
        if (this.isUndefined(this.reservationForm.mep_date)) {
          return null;
        }
        if (this.isUndefined(this.reservationForm.scanner_date)) {
          return this.isInSearchRange(this.reservationForm.mep_date);
        }
        return this.reservationForm.mep_date > this.reservationForm.scanner_date && this.isInSearchRange(this.reservationForm.mep_date);
      },

      ftrAfterMep() {
        if (this.isUndefined(this.reservationForm.ftr_date)) {
          return null;
        }
        if (this.isUndefined(this.reservationForm.mep_date)) {
          return this.isInSearchRange(this.reservationForm.ftr_date);
        }
        return this.reservationForm.ftr_date > this.reservationForm.mep_date && this.isInSearchRange(this.reservationForm.ftr_date);
      }
    },

    data() {

      return {
        sortBy: 'id',
        items : [],
        id : '',
        etat : '',
        fields: [{key :'id', sortable : true}, {key :'etat', sortable : true}, {key :'occupation', sortable : true}, {key :'remarque_matelas', sortable : false}, {key :'Action', sortable : false}],
        fields_data : ['nip','date_scanner','date_mep','date_ftr','nombre_seances','remarque','statut'],
        response : '',
        errors : '',
        today : '',
        maxDate : '9999-12-31',
        search_start_date : '',
        search_end_date : '',
        booking_start_date : '',
        booking_end_date : '',
        reservationForm : {
          mattress_id : '',
          nip : '' ,
          scanner_date : '' ,
          mep_date : '' ,
          session_nb : '' ,
          ftr_date : '' ,
          remark : '' ,
        },
        nullDate : moment(0),
      }
    },

    created: function() {
      //https://stackoverflow.com/questions/1531093/how-do-i-get-the-current-date-in-javascript
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");
      var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      var yyyy = today.getFullYear();

      today = yyyy + "-" + mm + "-" + dd;
      this.today = today;
    },

    methods: {
      equalsNullDate(other) {
        return this.nullDate.isSame(moment(other));
      },

      displayFormatted(date) {
        return moment(date).locale("fr").format("DD MMMM YYYY");
      },

      isInSearchRange(date) {
        return date >= this.booking_start_date && date <= this.booking_end_date;
      },

      isUndefined(item) {
        return item == "" || item == undefined;
      },

      saveToHistory(description) {
        axios.post("/api/addToHistory", {
          date: new Date(),
          description: description
        })
                .then(response => {
                  this.response = response;
                })
                .catch(e => {
                  alert(e);
                  this.errors = e;
                });
      },

      getMatelas: function(){
        axios.get('/api/')
                .then(response => {
                  this.items = response.data
                })
                .catch(e => {
                  this.errors = e
                })
      },

      deleteMatelas: function(idToDelete) {
        axios
                .delete("/api/", { data: { id: idToDelete } })
                .then(response => {
                  this.response = response;
                  this.getMatelas();
                })
                .catch(e => {
                  alert(e);
                  this.errors = e;
                });
      },

      search_mattresses() {
        this.booking_start_date = this.search_start_date;
        this.booking_end_date = this.search_end_date;
        this.search_free();
      },

      search_free() {
        axios
                .post("/api/search_free", {
                  start_date: this.booking_start_date,
                  end_date: this.booking_end_date
                })
                .then(response => {
                  this.items = response.data;
                })
                .catch(e => {
                  alert(e);
                  this.errors = e;
                });
      },

      sendBookingRequest(automatic = false){
        axios.post('/api/book_mattress',  {
          id: this.reservationForm.mattress_id,
          data: {
            nip: this.reservationForm.nip,
            date_scanner: this.reservationForm.scanner_date,
            date_mep: this.reservationForm.mep_date,
            nombre_seances: this.reservationForm.session_nb,
            date_ftr: this.reservationForm.ftr_date,
            remarque: this.reservationForm.remark
          }
        })
                .then(response => {
                  if(!response.data.success){
                    if(automatic){
                      this.autoReservationSubmit();
                    }
                    else{
                      var msg = 'La réservation du matelas n°' + this.reservationForm.mattress_id + ' a échouée car un autre utilisateur est déjà en train de le réserver !';
                      this.makeToast('b-toaster-top-center', 'Accès concurrent !', msg, 'danger');
                    }
                  }
                  else{
                    if(automatic){
                      this.saveToHistory("Réservation du matelas n°" + this.reservationForm.mattress_id + " du " + this.displayFormatted(this.reservationForm.scanner_date) + " au " + this.displayFormatted(this.reservationForm.ftr_date));
                      this.makeToast('b-toaster-top-center', 'Succès !', 'Le matelas n°' + this.reservationForm.mattress_id + ' vous a été attribué !', 'success');
                      this.$root.$emit('bv::hide::modal', 'auto-reservation');
                    }
                    else{
                      this.saveToHistory("Réservation du matelas n°" + this.reservationForm.mattress_id + " du " + this.displayFormatted(this.reservationForm.scanner_date) + " au " + this.displayFormatted(this.reservationForm.ftr_date));
                      this.search_free();
                      this.makeToast('b-toaster-top-center', 'Succès !', 'La réservation du matelas n°' + this.reservationForm.mattress_id + ' a été realisée avec succès !', 'success');
                    }
                  }
                })
                .catch(e => {
                  alert(e);
                  this.errors = e
                });
      },

      reservationSubmit() {
        axios
                .post("/api/unlock_mattress", {
                  id: this.reservationForm.mattress_id
                })
                .then(response => {
                  this.response = response;
                  this.sendBookingRequest();
                  this.$root.$emit("bv::hide::modal", "reservation");
                })
                .catch(e => {
                  alert(e);
                  this.errors = e;
                });
      },

      reservationReset() {
        // Reset our form values
        this.reservationForm.nip = "";
        this.reservationForm.scanner_date = "";
        this.reservationForm.mep_date = "";
        this.reservationForm.session_nb = "";
        this.reservationForm.ftr_date = "";
        this.reservationForm.remark = "";
        // Trick to reset/clear native browser form validation state
        this.show = false;
        this.$nextTick(() => {
          this.show = true;
        });
      },

      onShowModal() {
        axios
                .post("/api/lock_mattress", {
                  id: this.reservationForm.mattress_id
                })
                .then(response => {
                  this.response = response;
                  this.reservationReset();
                  this.reservationForm.scanner_date = this.booking_start_date;
                  this.reservationForm.ftr_date = this.booking_end_date;
                })
                .catch(e => {
                  alert(e);
                  this.errors = e;
                });
      },

      onHiddenModal() {
        axios
                .post("/api/unlock_mattress", {
                  id: this.reservationForm.mattress_id
                })
                .then(response => {
                  this.response = response;
                  this.reservationReset();
                })
                .catch(e => {
                  alert(e);
                  this.errors = e;
                });
      },

      send_to_modal(selected_mattress){
        this.reservationForm.mattress_id = selected_mattress;
        axios.post('/api/check_available',  {
          id: this.reservationForm.mattress_id,
          start_date: this.booking_start_date,
          end_date: this.booking_end_date
        })
                .then(response => {
                  if(!response.data.available){
                    this.search_free();
                    var msg = 'Vous ne pouvez pas réserver le matelas n°' + selected_mattress + ' car un autre utilisateur\
                    est déjà en train de le réserver ou ce dernier est devenu indisponible !';
                    this.makeToast('b-toaster-top-center', 'Accès concurrent !', msg, 'danger');
                  }
                  else{
                    this.$root.$emit('bv::show::modal', 'reservation');
                  }
                })
                .catch(e => {
                  alert(e);
                  this.errors = e
                });
      },

      //functions for the automatic reservation

      onShowAutoModal(){
        this.items = [];  //clear table
        this.search_start_date = '';
        this.search_end_date = '';

        this.reservationForm.mattress_id = '';

        this.booking_start_date = this.today;
        this.booking_end_date = this.maxDate;
        this.reservationReset();
      },

      onHiddenAutoModal(){
        this.reservationReset();
      },

      autoReservationSubmit(){
        axios.post('/api/automatic_booking',  {
          start_date : this.reservationForm.scanner_date,
          end_date : this.reservationForm.ftr_date
        })
                .then(response => {
                  if(response.data.found_id == null){
                    var msg = "Aucun matelas n'a pu être trouvé, veuillez réessayer ultérieurement ou utiliser la réservation manuelle.";
                    this.makeToast('b-toaster-top-center', 'Échec', msg, 'danger');
                    this.$root.$emit('bv::hide::modal', 'auto-reservation');
                  }
                  else{
                    this.reservationForm.mattress_id = response.data.found_id;
                    this.sendBookingRequest(true);
                  }
                })
                .catch(e => {
                  alert(e);
                  this.errors = e
                });
      },

      makeToast(toaster, title, content, variant, append = false) {
        this.$bvToast.toast(`${content}`, {
          title: `${title}`,
          toaster: toaster,
          solid: true,
          variant: variant,
          appendToast: append
        });
      }
    }
  };

</script>

<style>
  .red-text{
    color:red;
  }
</style>