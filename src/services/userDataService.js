export const userDataService = {

    async getFavourites(userId) {
        const res = await fetch(`api/favourites/${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async toggleFavourite(userId, dish){
        try {
            const current = await this.getFavourites(userId);
            const exists = current.dishes?.some( d => d._id === dish._id);
            const method = exists ? 'DELETE' : 'POST';
            const url = exists 
            ? `/api/favourites/${userId}/${dish._id}`
            : `/api/favourites/${userId}`;

            const res = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                body: exists ? undefined : JSON.stringify({ dish })
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        } catch (err) {
            console.warn("Favourites API failed, using fallback", err)
        }
    },

    async getRoute(userId) {
        const res = await fetch(`/api/routes/${userId}`);
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async addToRoute(userId, dish) {
        const res = await fetch(`/api/routes/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ dish })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async removeFromRoute(userId, dishId) {
        const res = await fetch(`/api/routes/${userId}/${dishId}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async clearRoute(userId) {
        const res = await fetch(`/api/routes/${userId}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
}