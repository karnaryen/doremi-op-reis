# apps-doremi-ui-layout

The frame around every screen: header, navigation, breadcrumbs, footer, and the 404 and error pages. Also the two states that every screen with data has: `PageLoader` (loading) and `ErrorAlert` (a failed request, as a translated text for the error code of the API).

The navigation is not written by hand: sections, tabs and breadcrumbs come from the route table. To change them, edit `apps-doremi-utils-routes`.

Phones get a bottom bar, larger screens a top bar: [mobile-design.md](../../../../docs/product/mobile-design.md#layout).
