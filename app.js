let webstore = new Vue({
    el: '#app',
    data: {
      sitename: "After School Club",
      showProduct: true,
      sortAttribute: 'price',
      sortOrder: 'asc',
      searchQuery: "", // For filtering by subject and location
      searchFilters: {
          id: "",
          quantity: "",
          subject: "",
          location: ""
      },
      lessons: [],
      cart: [],
      order: {
        firstName: "",
        lastName: "",
        address: "",
        phone: "",
        zip: ""
      }
    },
    computed: {
      cartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
      },
      cartTotal() {
        return this.cart.reduce((total, item) => total + (item.lesson.price * item.quantity), 0);
      },
      sortedLessons() {
        return this.lessons.sort((a, b) => {
          let result = 0;
          if (this.sortAttribute === 'price') result = a.price - b.price;
          else if (this.sortAttribute === 'subject') result = a.subject.localeCompare(b.subject);
          else if (this.sortAttribute === 'Location') result = a.Location.localeCompare(b.Location);
          else if (this.sortAttribute === 'availableInventory') result = a.availableInventory - b.availableInventory;
          else if (this.sortAttribute === 'rating') result = (a.rating || 0) - (b.rating || 0); // Sort by ratings
          return this.sortOrder === 'asc' ? result : -result;
        });
      },
      filteredLessons() {
        return this.sortedLessons.filter(lesson =>
          lesson.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          lesson.Location.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
    },
    methods: {
      fetchProducts() {
        // Construct the search URL with query parameters
        const { id, quantity, subject, location } = this.searchFilters;
        let searchUrl = `http://localhost:3000/search?`;
  
        if (id) searchUrl += `id=${id}&`;
        if (quantity) searchUrl += `quantity=${quantity}&`;
        if (subject) searchUrl += `subject=${subject}&`;
        if (location) searchUrl += `location=${location}&`;
  
        // Remove trailing '&'
        searchUrl = searchUrl.replace(/&$/, '');
  
        fetch(searchUrl)
          .then(response => response.json())
          .then(data => {
            this.lessons = data;
          })
          .catch(error => {
            console.error("Error fetching products:", error);
            alert("Failed to load products.");
          });
      },
      generateRowIndices() {
        const rows = [];
        const lessonsPerRow = 2;
        for (let i = 0; i < this.filteredLessons.length; i += lessonsPerRow) rows.push(i);
        return rows;
      },
      addToCart(lesson) {
        const found = this.cart.find(item => item.lesson.id === lesson.id);
        if (found) found.quantity++;
        else this.cart.push({ lesson, quantity: 1 });
        lesson.availableInventory--;
      },
      removeFromCart(index) {
        const item = this.cart[index];
        item.lesson.availableInventory += item.quantity;
        this.cart.splice(index, 1);
      },
      increaseQuantity(index) {
        const item = this.cart[index];
        if (item.lesson.availableInventory > 0) {
          item.quantity++;
          item.lesson.availableInventory--;
        }
      },
      decreaseQuantity(index) {
        const item = this.cart[index];
        if (item.quantity > 1) {
          item.quantity--;
          item.lesson.availableInventory++;
        }
      },
      canAddToCart(lesson) {
        return lesson.availableInventory > 0;
      },
      showCheckout() {
        this.showProduct = !this.showProduct;
      },
      resetCartAndForm() {
        this.cart = [];
        this.order = {
          firstName: "",
          lastName: "",
          address: "",
          phone: "",
          zip: ""
        };
        this.showProduct = true;
      },
      submitForm() {
        if (this.order.firstName && this.order.lastName && this.order.address && this.order.phone && this.order.zip) {
          const orderDetails = {
            ...this.order,
            cart: this.cart.map(item => ({
              lessonId: item.lesson.id,
              subject: item.lesson.subject,
              price: item.lesson.price,
              quantity: item.quantity,
            })),
            total: this.cartTotal,
          };
  
          fetch("http://localhost:3000/collection/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderDetails),
          })
            .then(response => {
              if (response.ok) {
                alert("Order placed successfully!");
                this.resetCartAndForm();
              } else {
                alert("Failed to place order.");
              }
            })
            .catch(error => console.error("Order submission error:", error));
        } else {
          alert("Please fill in all required fields.");
        }
      }
    },
    mounted() {
      this.fetchProducts(); // Fetch products when the app is mounted
    }
  });
  