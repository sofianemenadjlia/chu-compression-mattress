<template>

  <div>
    <b-navbar toggleable="lg" type="dark" variant="info">

      <b-navbar-brand href="/">
        <img src="../assets/chu_logo_original.png" width="50" height="50" alt="">
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item href="/booking">Réserver un matelas</b-nav-item>
          <b-nav-item href="/management" >Gestion de matelas</b-nav-item>
          <b-nav-item href="/history" >Historique</b-nav-item>
        </b-navbar-nav>

      </b-collapse>
    </b-navbar>

    <div id="tablediv">
      <h1>Réservation en cours le {{displayFormatted(date_current_day)}}</h1>
      <b-table :items="currentReservation"
               :fields="fields"
               :sort-by.sync="sortBy"
               fixed
               striped
               hover
               responsive>

        <template v-slot:cell(date_scanner)="date">
          {{displayFormatted(date.value)}}
        </template>

        <template v-slot:cell(date_mep)="date">
          {{displayFormatted(date.value)}}
        </template>

        <template v-slot:cell(date_ftr)="date">
          {{displayFormatted(date.value)}}
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

    data() {

      return {
        items: [],
        fields: [{key :'id_du_matelas', sortable : true}, {key :'nip', sortable : true}, {key :'date_scanner', sortable : true}, {key :'date_mep', sortable : true}, {key :'date_ftr', sortable : true},{key :'nombre_seances', sortable : false},{key :'remarques', sortable : false}],
        response: '',
        errors : '',
        sortBy: 'id_du_matelas',
        date_current_day : '',
        currentReservation: [],
        nullDate : moment(0),
      }
    },

    created: function () {
      this.date_current_day = moment();
      this.getMatelas_current_day();
    },

    methods: {
      equalsNullDate(other) {
        return this.nullDate.isSame(moment(other));
      },

      displayFormatted(date) {
        return moment(date).locale("fr").format("DD MMMM YYYY");
      },

      fillCurrentReservation(){
        for(var i =0; i<this.items.length; i++){
          for(var j=0;j<this.items[i].data.length; j++){
            if (this.items[i].data[j].statut == "En cours"){
              this.currentReservation.push({
                'id_du_matelas': this.items[i].id,
                'nip' : this.items[i].data[j].nip,
                'date_scanner': this.items[i].data[j].date_scanner,
                'date_mep': this.items[i].data[j].date_mep,
                'nombre_seances': this.items[i].data[j].nombre_seances,
                'date_ftr': this.items[i].data[j].date_ftr,
                'remarques': this.items[i].data[j].remarques,
              })
            }
          }
        }
      },

      getMatelas_current_day: function(){
        axios.get('/api/currentReservation')
                .then(response => {
                  this.items = response.data;
                  this.fillCurrentReservation();
                })
                .catch(e => {
                  this.errors = e
                })
      },
    }
  }

</script>

<style>
</style>