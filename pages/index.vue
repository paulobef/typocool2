<template>
  <div class="container">
    <div>
      <header class="content-logos">
        <logo />
      </header>
      <h1 class="title">Typocool 2</h1>
      <h2 class="subtitle">Coolest notepad in the Galaxy and beyond</h2>
      <div v-if="authUser" class="welcome spacing">
        <span> Welcome {{ authUser.displayName }}</span>
        <vs-button class="spacing" @click="createDocument"
          >Create a doc</vs-button
        >
        <DocList class="spacing" row />
      </div>
      <div v-else>
        <div v-if="!isSigningUp" class="form-container">
          <form class="form spacing" @submit.prevent="signUser">
            <ValidationProvider v-slot="v" class="spacing">
              <vs-input
                v-model="email"
                label="Email"
                placeholder="example@domain.com"
              />
              <span>{{ v.errors[0] }}</span>
            </ValidationProvider>
            <ValidationProvider v-slot="v" class="spacing">
              <vs-input
                v-model="password"
                label="Password"
                type="password"
                placeholder="8 alphanumerical characters"
              />
              <span>{{ v.errors[0] }}</span>
            </ValidationProvider>
            <vs-button class="spacing" type="submit">Sign in</vs-button>
            <span class="spacing error">{{ loginError }}</span>
          </form>
          <vs-button transparent class="spacing" @click="switchForm"
            >Sign up</vs-button
          >
        </div>
        <div v-if="isSigningUp" class="form-container">
          <form class="form spacing" @submit.prevent="createUser">
            <ValidationProvider v-slot="v" class="spacing">
              <vs-input v-model="name" label="Name" placeholder="Brad Pitt" />
              <span>{{ v.errors[0] }}</span>
            </ValidationProvider>
            <ValidationProvider v-slot="v" class="spacing">
              <vs-input
                v-model="email"
                label="Email"
                placeholder="example@domain.com"
              />
              <span>{{ v.errors[0] }}</span>
            </ValidationProvider>
            <ValidationProvider v-slot="v" class="spacing">
              <vs-input
                v-model="password"
                label="Password"
                type="password"
                placeholder="8 alphanumerical characters"
              />
              <span>{{ v.errors[0] }}</span>
            </ValidationProvider>
            <vs-button class="spacing" type="submit">Sign up</vs-button>
            <span class="spacing error">{{ loginError }}</span>
          </form>
          <vs-button transparent class="spacing" @click="switchForm"
            >Sign in</vs-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// TODO: add rules to validation provider
import { ValidationProvider } from 'vee-validate'
import DocList from '../containers/DocList.vue'
import Logo from '~/components/Logo.vue'

export default {
  components: {
    Logo,
    ValidationProvider,
    DocList,
  },
  data: () => ({
    isSigningUp: false,
    name: '',
    email: '',
    password: '',
    loginError: null,
    signUpError: null,
  }),
  computed: {
    authUser() {
      return this.$store.state.user
    },
  },
  methods: {
    async createDocument() {
      const db = this.$fireStore
      try {
        const metaDocRef = await db.collection('metas').add({
          title: '',
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          creator: this.authUser.uid,
          editors: [],
          viewers: [],
        })
        await db
          .collection('docs')
          .doc(metaDocRef.id)
          .set({
            version: 0,
            doc: {
              type: 'doc',
              content: [],
            },
          })
        await this.$router.push({
          name: 'id',
          params: { id: metaDocRef.id },
        })
        // we don't add steps yet
      } catch (error) {
        console.error('Error adding document: ', error)
      }
    },
    switchForm() {
      this.isSigningUp = !this.isSigningUp
      this.name = ''
      this.email = ''
      this.password = ''
      this.loginError = null
      this.signUpError = null
    },
    async createUser() {
      try {
        await this.$fireAuth.createUserWithEmailAndPassword(
          this.email,
          this.password
        )
        await this.$fireAuth.currentUser.updateProfile({
          displayName: this.name,
        })
      } catch (e) {
        this.signUpError =
          "Couldn't create an account because informations where uncorrectly formatted"
        console.warn(e)
      }
    },
    async signUser() {
      try {
        await this.$fireAuth
          .signInWithEmailAndPassword(this.email, this.password)
          .catch((error) => {
            this.loginError = 'Email or password unrecognized'
            console.warn(error)
            // ...
          })

        console.log('logged in')
      } catch (e) {
        this.loginError = 'Email or password unrecognized'
        console.warn(e)
      }
    },
  },
}
</script>

<style>
.container {
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.form-container {
  align-items: center;
  display: flex;
  flex-direction: column;
}
.welcome {
  align-items: center;
  display: flex;
  flex-direction: column;
}
.form {
  align-items: center;
  display: flex;
  flex-direction: column;
}

.spacing {
  margin-top: 30px;
}

.error {
  color: red;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 600;
  font-size: 55px;
  color: #35495e;
  letter-spacing: 1px;
  text-transform: capitalize;
  margin: 25px 0;
}

.subtitle {
  display: block;
  font-weight: 300;
  font-size: 1.1rem;
  color: #526488;
  word-spacing: 2px;
  padding-bottom: 15px;
}

.subtitle a {
  font-weight: 500;
  color: inherit;
}

.links {
  padding-top: 15px;
  margin-bottom: 20px;
}

.content-logos {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 500px;
}

.plus {
  font-size: 2.5rem;
  margin: 15px;
  color: #35495e;
}

.h3 {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
  margin: 10px;
}
</style>
