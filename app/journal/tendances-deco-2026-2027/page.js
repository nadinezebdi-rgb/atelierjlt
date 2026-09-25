import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import ShareButtons from '@/components/site/share-buttons'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

// ---- SEO ----
const TITLE = 'Tendances déco 2026-2027 : couleurs, matières et crochet'
const DESCRIPTION =
  'Découvrez les tendances déco 2026 et 2027 : terre cuite, tons minéraux, crochet et matières naturelles. Nos idées pour créer un intérieur chaleureux.'
const URL = 'https://atelierjlt.fr/journal/tendances-deco-2026-2027'
const IMAGE = IMAGES.heroBeige // canapé crème + plaid — image d'ouverture
const IMAGE_ALT =
  'Salon aux murs minéraux, sol en terre cuite, canapé en lin et plaid au crochet écru, rouille et vert olive.'
const PUBLISHED = '2025-06-15'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'tendances déco 2026 2027',
    'décoration intérieure 2026',
    'couleurs déco 2026',
    'tendances déco 2027',
    'décoration terracotta',
    'tons minéraux',
    'crochet en décoration',
    'décoration artisanale',
    'salon chaleureux',
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: 'article',
    publishedTime: PUBLISHED,
    authors: ['Atelier JLT'],
    siteName: 'Atelier JLT',
    images: [{ url: IMAGE, alt: IMAGE_ALT }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [IMAGE] },
}

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Tendances déco 2026 et 2027 : couleurs, matières et crochet',
  description: DESCRIPTION,
  image: [IMAGE],
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  author: [{ '@type': 'Organization', name: 'Atelier JLT', url: 'https://atelierjlt.fr' }],
  publisher: {
    '@type': 'Organization',
    name: 'Atelier JLT',
    logo: { '@type': 'ImageObject', url: 'https://atelierjlt.fr/logo.png' },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
  keywords:
    'tendances déco 2026 2027, terre cuite, tons minéraux, crochet en décoration, décoration artisanale, salon chaleureux',
  articleSection: 'Tendances',
  inLanguage: 'fr-FR',
}

export default function TendancesDeco20262027() {
  return (
    <div className="min-h-screen bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Header />
      <main>
        {/* Fil d'ariane + retour */}
        <div className="container pt-6 pb-2 text-[11px] uppercase tracking-[0.22em] text-ink/50">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/journal" className="hover:text-ink">Journal</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">Tendances déco 2026-2027</span>
        </div>

        {/* En-tête éditoriale */}
        <header className="container pt-8 md:pt-12 pb-10 md:pb-16 border-b border-linen">
          <div className="max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">
              Le Journal · Tendances
            </span>
            <h1
              className="font-display font-normal text-4xl md:text-6xl leading-[1.02] mt-5 text-balance"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              Tendances déco 2026 et 2027 : couleurs, matières et crochet
            </h1>
            <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-ink/50">
              <span>Atelier JLT</span>
              <span className="text-ink/25">·</span>
              <time dateTime={PUBLISHED}>15 juin 2025</time>
              <span className="text-ink/25">·</span>
              <span>Lecture 6 min</span>
            </div>
          </div>
        </header>

        {/* Image d'ouverture */}
        <figure className="container pt-10 md:pt-16">
          <div className="relative aspect-[16/9] overflow-hidden bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGE} alt={IMAGE_ALT} className="w-full h-full object-cover" />
          </div>
          <figcaption className="mt-4 text-[12px] text-ink/50 italic max-w-3xl">
            Terre cuite, tons minéraux et crochet composent un salon chaleureux aux accents artisanaux.
          </figcaption>
        </figure>

        {/* Corps de l'article */}
        <article className="container py-12 md:py-20 max-w-3xl article-body">
          <p className="text-lg md:text-xl leading-[1.75] text-ink/85 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.9] first-letter:mr-2 first-letter:float-left first-letter:mt-1 first-letter:text-emerald">
            Quelles tendances déco adopter en 2026 et quelles inspirations suivre pour 2027 ? Les
            couleurs terreuses, les tons minéraux et les matières texturées dessinent une décoration
            intérieure chaleureuse. Dans cette sélection, la terre cuite apporte de la profondeur,
            le crochet personnalise les textiles et les objets artisanaux donnent du caractère. Pour
            2027, les prévisions colorées ouvrent aussi la voie à des accents plus vifs. Du salon à
            la chambre, voici comment associer ces inspirations chez vous, choisir les bonnes
            couleurs et renouveler votre intérieur en conservant les meubles que vous aimez.
          </p>

          <H2>Terre cuite et terracotta : comment les adopter chez soi ?</H2>
          <P>
            La terre cuite apporte immédiatement une présence, même sous la forme d’un simple
            objet. Son rouge orangé, parfois rosé ou bruni, évoque les sols anciens, les ateliers
            de potiers et les maisons méditerranéennes. Dans une décoration contemporaine, elle
            trouve sa place auprès de lignes sobres et de surfaces claires. Une coupe généreuse
            sur une table suffit à donner du relief à un ensemble discret.
          </P>
          <P>
            Pour l’adopter, nul besoin de remplacer tous les revêtements. Un vase, un pied de
            lampe ou plusieurs pots peuvent installer cette tonalité par touches. Sur une grande
            surface, mieux vaut observer les variations de lumière avant de choisir la nuance. Un
            terracotta soutenu semblera enveloppant dans une chambre, mais pourra paraître plus
            intense dans un petit espace sombre. Associé à un blanc cassé et à du bois, il
            conserve une belle simplicité.
          </P>

          <H2>Quelles couleurs choisir pour une décoration tendance en 2026 ?</H2>
          <P>
            Craie, sable, argile, galet : le vocabulaire minéral offre une palette beaucoup plus
            variée qu’un alignement de beiges. Certains tons tirent vers le rose, d’autres vers le
            gris, le jaune ou le vert. Leur intérêt réside dans ces différences discrètes. Pour
            construire un décor harmonieux, on peut partir d’une couleur dominante, puis faire
            varier les matières et les intensités autour d’elle. Un rideau écru, un tapis chiné et
            un mur grège ne racontent jamais exactement la même chose.
          </P>
          <P>
            Cette recherche de chaleur rejoint{' '}
            <a
              href="https://www.homesandgardens.com/interior-design/shop-the-key-color-trends-of-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald underline underline-offset-4 decoration-emerald/30 hover:decoration-emerald transition"
            >
              les orientations chromatiques relevées pour 2026
            </a>
            , notamment autour des bruns et des nuances terreuses. Elle laisse cependant toute sa
            place au contraste. Un brun chocolat peut souligner une bibliothèque ou donner de la
            profondeur à une assise. Un vert sourd rafraîchit une composition très ocrée. L’enjeu
            consiste à trouver un équilibre adapté à la pièce, à son exposition et aux meubles
            que l’on souhaite garder.
          </P>

          <H2>Le crochet en décoration : une touche artisanale et chaleureuse</H2>
          <P>
            Le crochet en décoration est une piste à explorer pour personnaliser un salon ou une
            chambre. Il introduit une texture immédiatement identifiable, faite de boucles, de
            vides et de motifs répétés. Il évoque aussi des gestes transmis, des ouvrages
            commencés le soir et des objets conservés longtemps. Son intérêt décoratif dépasse
            pourtant le souvenir familial : une maille graphique peut dialoguer avec une table
            contemporaine, une photographie ou un fauteuil aux proportions franches.
          </P>
          <P>
            Le bon dosage dépend surtout de l’effet recherché. Un coussin écru apporte un relief
            discret ; un plaid composé de carrés colorés devient le point de départ de toute une
            palette. Pour éviter une accumulation visuelle, mieux vaut lui laisser de l’espace et
            choisir des textiles voisins plus unis. On peut également détourner un ouvrage ancien
            en décoration murale, à condition de respecter sa fragilité. Le crochet devient alors
            une pièce personnelle, choisie pour sa beauté autant que pour son histoire.
          </P>

          <Pull>
            « Le crochet redevient un langage contemporain : une maille graphique dialogue avec
            une table sobre, une photographie ou un fauteuil aux lignes franches. »
          </Pull>

          <H2>Bois, lin et céramique : quelles matières associer ?</H2>
          <P>
            Le charme de ces ambiances tient aux rencontres entre surfaces. Le grain d’une
            céramique, les veines d’un bois et le tissage d’un rideau produisent un relief que la
            couleur seule ne peut créer. Dans un salon peu meublé, ces variations suffisent
            parfois à rendre l’ensemble vivant. Elles gagnent à être observées de près, mais
            aussi depuis l’entrée de la pièce : une décoration réussie fonctionne à plusieurs
            distances.
          </P>
          <P>
            Pour composer cet équilibre, associer trois ou quatre matières peut constituer un
            bon point de départ. Par exemple, du bois, du lin, une terre cuite et une touche de
            verre. Cette dernière apporte un éclat qui allège les surfaces mates. Il faut aussi
            penser aux usages : un plateau poreux, un textile délicat ou un tapis clair ne
            demandent pas le même entretien. Le choix le plus convaincant reste celui que l’on
            aura plaisir à utiliser quotidiennement.
          </P>

          <H2>Objets artisanaux et meubles chinés pour un intérieur personnel</H2>
          <P>
            Une pièce artisanale attire souvent le regard par un détail : une anse légèrement
            asymétrique, une variation d’émail, une couture visible. Ces particularités peuvent
            devenir les accents d’un intérieur. Elles invitent à choisir plus attentivement, à
            s’intéresser à une fabrication et à laisser chaque objet exister. Une étagère n’a
            pas besoin d’être remplie pour être expressive ; quelques pièces de tailles
            différentes peuvent offrir une composition bien plus lisible.
          </P>
          <P>
            Cette approche se prête également aux objets chinés et aux meubles de famille. Une
            commode ancienne peut accueillir une lampe actuelle, tandis qu’une chaise
            dépareillée trouve sa place près d’un bureau sobre. Avant d’acheter, déplacer,
            réparer ou changer une housse permet parfois de découvrir un potentiel oublié. Le
            caractère d’une maison se construit ainsi progressivement, avec des choix qui
            répondent à une vie réelle et pas seulement à une image séduisante.
          </P>

          <H2>Tendances déco 2027 : quelle place pour le bleu ?</H2>
          <P>
            Les perspectives pour 2027 ne se limitent pas aux tonalités douces.{' '}
            <a
              href="https://www.wgsn.com/en/blog/colour-year-2027-luminous-blue"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald underline underline-offset-4 decoration-emerald/30 hover:decoration-emerald transition"
            >
              WGSN et Coloro ont désigné Luminous Blue comme couleur de l’année 2027
            </a>
            , un bleu soutenu qui ouvre une autre voie. Il s’agit d’une proposition prospective,
            et non d’une règle destinée à tous les intérieurs. Dans notre palette de terres et
            de fibres, cette teinte suggère surtout la possibilité d’un accent plus vif,
            capable de réveiller une composition tranquille.
          </P>
          <P>
            On peut imaginer une céramique bleue sur un meuble en noyer, un petit tableau au
            milieu de murs sable ou une assise colorée près d’un sol en terre cuite. Ces
            associations constituent des pistes de décoration, pas des obligations d’achat.
            Pour tester une couleur forte, un échantillon, un tissu ou un objet déplaçable
            suffit souvent. Laisser passer quelques jours permet de vérifier si cette présence
            reste agréable à différentes heures.
          </P>

          <H2>Comment adopter ces tendances déco avec un petit budget ?</H2>
          <P>
            Pour adopter les tendances déco 2026 et 2027 avec un petit budget, commencez par ce
            que vous possédez. Déplacez une lampe, rassemblez vos poteries et réutilisez un
            plaid ancien. Choisissez ensuite un seul achat utile : une housse de coussin, un
            rideau ou un abat-jour. Dans le salon, reprenez une couleur déjà présente dans un
            tableau. Dans la chambre, harmonisez le linge de lit avec les murs pour créer une
            ambiance apaisante.
          </P>
          <P>
            Observez également les passages et les endroits où vous aimez vous installer. Une
            table facilement accessible, un siège confortable et un rideau bien dimensionné
            donnent aux matières choisies un rôle concret. La beauté d’une pièce se mesure aussi
            au plaisir que l’on éprouve à y rester.
          </P>
          <P>
            La force des terres cuites, des tons minéraux et du crochet tient finalement à leur
            capacité à accueillir des histoires différentes. Leur cohérence vient des liens que
            l’on crée entre eux. Les tendances offrent des idées ; les habitudes, les souvenirs
            et les envies donnent au décor sa justesse. C’est dans cette rencontre que la
            maison prend véritablement son caractère.
          </P>

          {/* Partage social */}
          <ShareButtons
            url="/journal/tendances-deco-2026-2027"
            title="Tendances déco 2026-2027 : couleurs, matières et crochet"
            image={IMAGE}
          />

          {/* Séparateur */}
          <div className="mt-16 pt-10 border-t border-linen flex items-center justify-between">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-ink/60 hover:text-emerald transition"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Retour au Journal
            </Link>
            <Link
              href="/collections"
              className="inline-block text-[11px] uppercase tracking-[0.28em] text-emerald border-b border-emerald/40 hover:border-emerald pb-0.5"
            >
              Découvrir nos pièces
            </Link>
          </div>
        </article>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

// ---- Petits composants typographiques pour l'article ----
function H2({ children }) {
  return (
    <h2
      className="font-display font-normal text-3xl md:text-4xl mt-14 mb-5 leading-tight text-balance"
      style={{ fontFamily: 'var(--font-display), serif', fontWeight: 500 }}
    >
      {children}
    </h2>
  )
}
function P({ children }) {
  return (
    <p className="text-[16px] md:text-[17px] leading-[1.85] text-ink/80 mt-5">
      {children}
    </p>
  )
}
function Pull({ children }) {
  return (
    <blockquote className="my-12 border-l-2 border-emerald pl-6 py-2 font-display italic text-xl md:text-2xl text-ink/85 leading-[1.5]">
      {children}
    </blockquote>
  )
}
