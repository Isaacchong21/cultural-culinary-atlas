import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
    state: () => ({
        term: "",
        context: "global",
    }),
    
    actions: {
        setSearch(term, context= "global"){
            this.term = term;
            this.context = context;
        },

        clear() {
            this.term = "";
        },

        triggerMapSearch(term) {
            this.setSearch(term, "map")
        }
    }
});