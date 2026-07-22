import {APP_NAME, CATCH_ALL, ComponentRegistry} from "@enonic/nextjs-adapter";
import PropsView from "@enonic/nextjs-adapter/views/PropsView";
import {commonQuery, commonVariables} from "./queries/common";
import "@enonic/nextjs-adapter/baseMappings";
import ProductPage from "./enonic/pages/ProductPage";
import LandingPage from "./enonic/pages/LandingPage";
import ProductDetail from "./enonic/parts/ProductDetail";
import ProductGalleryPart from "./enonic/parts/ProductGalleryPart";
import ProductInfoPart from "./enonic/parts/ProductInfoPart";
import ProductTabsPart from "./enonic/parts/ProductTabsPart";
import ProductActionsPart from "./enonic/parts/ProductActionsPart";
import RelatedProductsPart from "./enonic/parts/RelatedProductsPart";
import ProductUpsellPart from "./enonic/parts/ProductUpsellPart";
import ProductShowcase from "./enonic/parts/ProductShowcase";
import HeroPart from "./enonic/parts/HeroPart";
import RichTextPart from "./enonic/parts/RichTextPart";
import CollectionsScrollerPart from "./enonic/parts/CollectionsScrollerPart";
import BlogGridPart from "./enonic/parts/BlogGridPart";
import EmptyPart from "./enonic/parts/EmptyPart";
import HeadingPart from "./enonic/parts/HeadingPart";
import ParagraphPart from "./enonic/parts/ParagraphPart";
import SiteSettings from "./enonic/parts/SiteSettings";
import CollectionPage from "./enonic/pages/CollectionPage";
import CollectionDetailPart from "./enonic/parts/CollectionDetailPart";

ComponentRegistry.setCommonQuery([commonQuery, commonVariables]);

// Page mappings
ComponentRegistry.addPage(`${APP_NAME}:product`, { view: ProductPage });
ComponentRegistry.addPage(`${APP_NAME}:landing`, { view: LandingPage });
ComponentRegistry.addPage(`${APP_NAME}:home`, { view: LandingPage });
ComponentRegistry.addPage(`${APP_NAME}:collection`, { view: CollectionPage });

// Part mappings
ComponentRegistry.addPart(`${APP_NAME}:product-detail`, { view: ProductDetail });
ComponentRegistry.addPart(`${APP_NAME}:product-gallery`, { view: ProductGalleryPart });
ComponentRegistry.addPart(`${APP_NAME}:product-info`, { view: ProductInfoPart });
ComponentRegistry.addPart(`${APP_NAME}:product-tabs`, { view: ProductTabsPart });
ComponentRegistry.addPart(`${APP_NAME}:product-actions`, { view: ProductActionsPart });
ComponentRegistry.addPart(`${APP_NAME}:related-products`, { view: RelatedProductsPart });
ComponentRegistry.addPart(`${APP_NAME}:product-upsell`, { view: ProductUpsellPart });
ComponentRegistry.addPart(`${APP_NAME}:product-showcase`, { view: ProductShowcase });
ComponentRegistry.addPart(`${APP_NAME}:hero`, { view: HeroPart });
ComponentRegistry.addPart(`${APP_NAME}:rich-text`, { view: RichTextPart });
ComponentRegistry.addPart(`${APP_NAME}:collections-scroller`, { view: CollectionsScrollerPart });
ComponentRegistry.addPart(`${APP_NAME}:blog-grid`, { view: BlogGridPart });
ComponentRegistry.addPart(`${APP_NAME}:paragraph`, { view: ParagraphPart });
ComponentRegistry.addPart(`${APP_NAME}:collection-detail`, { view: CollectionDetailPart });
ComponentRegistry.addPart(`${APP_NAME}:child-list`, { view: EmptyPart });
ComponentRegistry.addPart(`${APP_NAME}:heading`, { view: HeadingPart });
ComponentRegistry.addPart(`${APP_NAME}:movie-details`, { view: EmptyPart });
ComponentRegistry.addPart(`${APP_NAME}:site-settings`, { view: SiteSettings });
ComponentRegistry.addPart(CATCH_ALL, { view: EmptyPart });

// Content type catch-all
ComponentRegistry.addContentType(CATCH_ALL, { view: PropsView });
